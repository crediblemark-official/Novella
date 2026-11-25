import { formatRp, renderOrdersTable } from './admin-table';
import { loadAdminSettings, renderBankList, bindAdminSettingsEvents } from './admin-settings';
import { fetchAdminBooks, deleteAdminBook, fetchAdminTestimonials, deleteAdminTestimonial, bindAdminShowcaseEvents } from './admin-showcase';
import { fetchAdminAuthors, exportOrdersCsv } from './admin-authors';
import { bindAdminDialogEvents, openTrackingDialog, openPricingDialog, openConfirmDialog } from './admin-dialogs';

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
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.remove('hidden');
  setTimeout(() => toast.classList.add('hidden'), 2500);
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
    if (lbl) lbl.textContent = user.name || user.email;
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
    if (btn) { btn.disabled = false; btn.textContent = 'Masuk'; }
  }
}

async function fetchKPI() {
  try {
    const res = await fetch(`${API_BASE}/admin/kpi`, { headers: getAuthHeaders(), credentials: 'include' });
    if (!res.ok) return;
    const kpi = await res.json();
    const setEl = (id: string, v: string) => { const el = document.getElementById(id); if (el) el.textContent = v; };
    setEl('kpi-total-orders', String(kpi.totalOrders));
    setEl('kpi-waiting-orders', String(kpi.waitingVerification));
    setEl('kpi-active-value', formatRp(kpi.totalActiveValue));
  } catch {}
}

async function fetchOrders() {
  const tbody = document.getElementById('orders-tbody');
  if (!tbody) return;
  try {
    const res = await fetch(`${API_BASE}/orders`);
    if (res.ok) { allOrders = await res.json(); renderOrdersTable(tbody, allOrders, activeFilter, searchQuery); }
  } catch { tbody.innerHTML = '<tr><td colspan="11" class="px-4 py-8 text-center text-rose-500 font-bold">Gagal memuat data dari server.</td></tr>'; }
}

export function initAdminController() {
  bindAdminDialogEvents();
  (window as any)._adminBanks = (window as any)._adminBanks || [];
  (window as any).removeBankRow = (idx: number) => { (window as any)._adminBanks.splice(idx, 1); renderBankList((window as any)._adminBanks); };
  (window as any).deleteBookItem = (id: number) => deleteAdminBook(id, showAdminToast);
  (window as any).deleteTestimonialItem = (id: number) => deleteAdminTestimonial(id, showAdminToast);

  (window as any).updateOrderStatus = async function (orderCode: string, newStatus: string) {
    if (newStatus === 'Diproses' && !(await openConfirmDialog('Verifikasi Pembayaran', `Konfirmasi verifikasi pembayaran untuk ${orderCode} dan mulai proses cetak?`, 'Verifikasi'))) {
      fetchOrders(); return;
    }
    try {
      const res = await fetch(`${API_BASE}/orders/${orderCode}/status`, { method: 'PATCH', headers: getAuthHeaders(), body: JSON.stringify({ status: newStatus }) });
      if (res.ok) { showAdminToast(`Status ${orderCode} diubah ke "${newStatus}".`); fetchKPI(); fetchOrders(); }
    } catch { showAdminToast('Gagal mengubah status.'); }
  };

  (window as any).promptTracking = (orderCode: string, curCourier: string, curResi: string) => {
    openTrackingDialog(orderCode, curCourier, curResi, async (shippingCourier, shippingTrackingNumber) => {
      try {
        const res = await fetch(`${API_BASE}/admin/orders/${orderCode}/tracking`, {
          method: 'PATCH', headers: getAuthHeaders(), body: JSON.stringify({ shippingCourier, shippingTrackingNumber }),
        });
        if (res.ok) { showAdminToast(`Nomor resi ${shippingTrackingNumber} disimpan.`); fetchOrders(); }
      } catch { showAdminToast('Gagal menyimpan resi.'); }
    });
  };

  (window as any).promptPricing = (orderCode: string, curPages: number, curPrice: number) => {
    openPricingDialog(orderCode, curPages, curPrice, async (pages, totalPrice) => {
      try {
        const res = await fetch(`${API_BASE}/admin/orders/${orderCode}/pricing`, {
          method: 'PATCH', headers: getAuthHeaders(), body: JSON.stringify({ pages, totalPrice }),
        });
        if (res.ok) { showAdminToast(`Halaman & biaya ${orderCode} diperbarui.`); fetchKPI(); fetchOrders(); }
      } catch { showAdminToast('Gagal memperbarui biaya.'); }
    });
  };

  const mainTabs = document.querySelectorAll('.admin-main-tab');
  const panels = document.querySelectorAll('.admin-panel');
  const drawer = document.getElementById('admin-mobile-drawer');
  const topTitle = document.getElementById('admin-topbar-title');
  const closeDrawer = () => drawer?.classList.add('hidden');
  document.getElementById('btn-admin-drawer')?.addEventListener('click', () => drawer?.classList.remove('hidden'));
  document.getElementById('btn-close-drawer')?.addEventListener('click', closeDrawer);
  document.getElementById('admin-drawer-backdrop')?.addEventListener('click', closeDrawer);

  mainTabs.forEach((tab) => tab.addEventListener('click', () => {
    const target = tab.getAttribute('data-main-tab');
    mainTabs.forEach((t) => {
      const on = t.getAttribute('data-main-tab') === target;
      ['bg-navy', 'text-white', 'font-bold'].forEach((c) => t.classList.toggle(c, on));
      ['text-slate-600', 'font-semibold', 'hover:bg-slate-100'].forEach((c) => t.classList.toggle(c, !on));
    });
    panels.forEach((p) => p.classList.add('hidden'));
    document.getElementById(`panel-${target}`)?.classList.remove('hidden');
    if (topTitle) topTitle.textContent = tab.getAttribute('data-tab-label') || 'Pesanan';
    closeDrawer();
  }));

  // Login & Logout
  document.getElementById('admin-login-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    handleAdminLogin((document.getElementById('admin-email') as HTMLInputElement)?.value, (document.getElementById('admin-password') as HTMLInputElement)?.value);
  });
  document.querySelectorAll('[data-admin-logout]').forEach((btn) => btn.addEventListener('click', async () => {
    try { await fetch(`${API_BASE}/admin/logout`, { method: 'POST', credentials: 'include' }); } catch {}
    localStorage.removeItem(ADMIN_STORAGE_KEY);
    currentAdminToken = '';
    showAdminToast('Sesi redaksi telah diakhiri.');
    setTimeout(() => location.reload(), 500);
  }));
  document.getElementById('btn-refresh-admin')?.addEventListener('click', () => { fetchKPI(); fetchOrders(); showAdminToast('Data disinkronkan.'); });
  bindAdminSettingsEvents(showAdminToast);
  bindAdminShowcaseEvents(showAdminToast);
  document.getElementById('btn-export-csv')?.addEventListener('click', () => exportOrdersCsv());

  document.querySelectorAll('.admin-tab').forEach((tab) => tab.addEventListener('click', () => {
    document.querySelectorAll('.admin-tab').forEach((t) => { t.classList.remove('bg-navy', 'text-white'); t.classList.add('bg-white', 'text-slate-600', 'border', 'border-slate-200'); });
    tab.classList.remove('bg-white', 'text-slate-600', 'border', 'border-slate-200'); tab.classList.add('bg-navy', 'text-white');
    activeFilter = tab.getAttribute('data-filter') || 'ALL';
    const tb = document.getElementById('orders-tbody');
    if (tb) renderOrdersTable(tb, allOrders, activeFilter, searchQuery);
  }));

  document.getElementById('admin-search-input')?.addEventListener('input', (e) => {
    searchQuery = (e.target as HTMLInputElement).value;
    const tb = document.getElementById('orders-tbody');
    if (tb) renderOrdersTable(tb, allOrders, activeFilter, searchQuery);
  });

  checkAdminAuth();
}
