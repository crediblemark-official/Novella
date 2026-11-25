import { formatRp, renderOrdersTable } from './admin-table';
import { loadAdminSettings, renderBankList, bindAdminSettingsEvents } from './admin-settings';
import { fetchAdminBooks, deleteAdminBook, fetchAdminTestimonials, deleteAdminTestimonial, bindAdminShowcaseEvents } from './admin-showcase';
import { fetchAdminAuthors, exportOrdersCsv } from './admin-authors';

const API_BASE = typeof window !== 'undefined' && window.location.port === '4321' ? 'http://localhost:3001/api' : '/api';
const ADMIN_STORAGE_KEY = 'novella_admin_session';

let allOrders: any[] = [];
let activeFilter = 'ALL';
let searchQuery = '';
let currentAdminToken = '';

function getAuthHeaders(): Record<string, string> {
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  if (currentAdminToken) {
    h['Authorization'] = `Bearer ${currentAdminToken}`;
    h['x-admin-token'] = currentAdminToken;
  }
  return h;
}

export function showAdminToast(msg: string) {
  const toast = document.getElementById('admin-toast');
  if (toast) {
    toast.textContent = msg;
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), 2500);
  }
}

function setAdminUi(isAuthed: boolean, user?: any, errMsg?: string) {
  document.getElementById('admin-loading-screen')?.classList.add('hidden');
  const guard = document.getElementById('admin-auth-guard');
  guard?.classList.toggle('hidden', isAuthed);
  guard?.classList.toggle('flex', !isAuthed);
  document.getElementById('admin-dashboard-content')?.classList.toggle('hidden', !isAuthed);
  const banner = document.getElementById('auth-error-banner');
  if (banner) {
    banner.textContent = errMsg || 'Email atau kata sandi tidak valid.';
    banner.classList.toggle('hidden', !errMsg);
  }
  if (isAuthed && user) {
    const lbl = document.getElementById('admin-identity-label');
    if (lbl) lbl.textContent = `Staf Redaksi: ${user.name || user.email}`;
    fetchKPI(); fetchOrders(); fetchAdminBooks(); fetchAdminTestimonials(); fetchAdminAuthors();
    loadAdminSettings().then((d) => { if (d) (window as any)._adminBanks = d.bankAccounts || []; });
  }
}

async function checkAdminAuth() {
  currentAdminToken = localStorage.getItem(ADMIN_STORAGE_KEY) || '';
  try {
    const res = await fetch(`${API_BASE}/admin/verify`, { headers: getAuthHeaders(), credentials: 'include' });
    if (res.ok) {
      const data = await res.json();
      if (data.authenticated && data.user) return setAdminUi(true, data.user);
    }
  } catch {}
  setAdminUi(false);
}

async function handleAdminLogin(email: string, pass: string) {
  const btn = document.getElementById('btn-admin-submit') as HTMLButtonElement | null;
  if (btn) { btn.disabled = true; btn.textContent = 'Memverifikasi...'; }
  try {
    const res = await fetch(`${API_BASE}/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password: pass }),
    });
    const data = await res.json();
    if (res.ok && data.success) {
      currentAdminToken = data.token;
      localStorage.setItem(ADMIN_STORAGE_KEY, data.token);
      setAdminUi(true, data.user);
      showAdminToast('Berhasil masuk sebagai staf redaksi!');
    } else {
      setAdminUi(false, undefined, data.error || 'Autentikasi staf redaksi gagal.');
    }
  } catch {
    setAdminUi(false, undefined, 'Tidak dapat terhubung ke server backend.');
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = 'Masuk ke Dashboard'; }
  }
}

async function fetchKPI() {
  try {
    const res = await fetch(`${API_BASE}/admin/kpi`, { headers: getAuthHeaders(), credentials: 'include' });
    if (res.ok) {
      const kpi = await res.json();
      const elTotal = document.getElementById('kpi-total-orders');
      const elWaiting = document.getElementById('kpi-waiting-orders');
      const elActive = document.getElementById('kpi-active-value');
      if (elTotal) elTotal.textContent = String(kpi.totalOrders);
      if (elWaiting) elWaiting.textContent = String(kpi.waitingVerification);
      if (elActive) elActive.textContent = formatRp(kpi.totalActiveValue);
    }
  } catch {}
}

async function fetchOrders() {
  const tbody = document.getElementById('orders-tbody');
  if (!tbody) return;
  try {
    const res = await fetch(`${API_BASE}/orders`);
    if (res.ok) {
      allOrders = await res.json();
      renderOrdersTable(tbody, allOrders, activeFilter, searchQuery);
    }
  } catch {
    tbody.innerHTML = '<tr><td colspan="7" class="px-4 py-8 text-center text-rose-500 font-bold">Gagal memuat data dari server.</td></tr>';
  }
}

export function initAdminController() {
  (window as any)._adminBanks = (window as any)._adminBanks || [];
  (window as any).removeBankRow = (idx: number) => {
    (window as any)._adminBanks.splice(idx, 1);
    renderBankList((window as any)._adminBanks);
  };
  (window as any).deleteBookItem = (id: number) => deleteAdminBook(id, showAdminToast);
  (window as any).deleteTestimonialItem = (id: number) => deleteAdminTestimonial(id, showAdminToast);

  (window as any).updateOrderStatus = async function (orderCode: string, newStatus: string) {
    if (newStatus === 'Diproses' && !confirm(`Konfirmasi Verifikasi Pembayaran untuk ${orderCode}?`)) {
      fetchOrders(); return;
    }
    try {
      const res = await fetch(`${API_BASE}/orders/${orderCode}/status`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) { showAdminToast(`Status ${orderCode} diubah ke "${newStatus}".`); fetchKPI(); fetchOrders(); }
    } catch { showAdminToast('Gagal mengubah status.'); }
  };

  (window as any).promptTracking = async function (orderCode: string, curCourier: string, curResi: string) {
    const courier = prompt(`Nama Ekspedisi untuk pesanan ${orderCode}:`, curCourier || 'JNE');
    if (!courier) return;
    const tracking = prompt(`Nomor Resi Pengiriman:`, curResi || '');
    if (!tracking) return;
    try {
      const res = await fetch(`${API_BASE}/admin/orders/${orderCode}/tracking`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ shippingCourier: courier, shippingTrackingNumber: tracking }),
      });
      if (res.ok) { showAdminToast(`Nomor resi ${tracking} disimpan.`); fetchOrders(); }
    } catch { showAdminToast('Gagal menyimpan nomor resi.'); }
  };

  // Main Tabs Switcher
  const mainTabs = document.querySelectorAll('.admin-main-tab');
  const panels = document.querySelectorAll('.admin-panel');
  mainTabs.forEach((tab) => tab.addEventListener('click', () => {
    const target = tab.getAttribute('data-main-tab');
    mainTabs.forEach((t) => { t.classList.remove('border-navy', 'text-navy'); t.classList.add('border-transparent', 'text-slate-500'); });
    tab.classList.remove('border-transparent', 'text-slate-500'); tab.classList.add('border-navy', 'text-navy');
    panels.forEach((p) => p.classList.add('hidden'));
    document.getElementById(`panel-${target}`)?.classList.remove('hidden');
  }));

  // Login & Logout
  document.getElementById('admin-login-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    handleAdminLogin((document.getElementById('admin-email') as HTMLInputElement)?.value, (document.getElementById('admin-password') as HTMLInputElement)?.value);
  });

  document.getElementById('btn-admin-logout')?.addEventListener('click', async () => {
    try { await fetch(`${API_BASE}/admin/logout`, { method: 'POST', credentials: 'include' }); } catch {}
    localStorage.removeItem(ADMIN_STORAGE_KEY);
    currentAdminToken = '';
    showAdminToast('Sesi redaksi telah diakhiri.');
    setTimeout(() => location.reload(), 500);
  });

  document.getElementById('btn-refresh-admin')?.addEventListener('click', () => {
    fetchKPI(); fetchOrders(); showAdminToast('Data disinkronkan kembali.');
  });
  bindAdminSettingsEvents(showAdminToast);
  bindAdminShowcaseEvents(showAdminToast);
  document.getElementById('btn-export-csv')?.addEventListener('click', () => exportOrdersCsv());

  document.querySelectorAll('.admin-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.admin-tab').forEach((t) => { t.classList.remove('bg-navy', 'text-white'); t.classList.add('bg-white', 'text-slate-600', 'border', 'border-slate-200'); });
      tab.classList.remove('bg-white', 'text-slate-600', 'border', 'border-slate-200'); tab.classList.add('bg-navy', 'text-white');
      activeFilter = tab.getAttribute('data-filter') || 'ALL';
      const tb = document.getElementById('orders-tbody');
      if (tb) renderOrdersTable(tb, allOrders, activeFilter, searchQuery);
    });
  });

  document.getElementById('admin-search-input')?.addEventListener('input', (e) => {
    searchQuery = (e.target as HTMLInputElement).value;
    const tb = document.getElementById('orders-tbody');
    if (tb) renderOrdersTable(tb, allOrders, activeFilter, searchQuery);
  });

  checkAdminAuth();
}
