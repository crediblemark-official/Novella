import { formatRp, renderOrdersTable } from './admin-table';

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

function showAdminToast(msg: string) {
  const toast = document.getElementById('admin-toast');
  if (toast) {
    toast.textContent = msg;
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), 2500);
  }
}

function setAdminUi(isAuthed: boolean, user?: any, errMsg?: string) {
  document.getElementById('admin-loading-screen')?.classList.add('hidden');
  document.getElementById('admin-auth-guard')?.classList.toggle('hidden', isAuthed);
  document.getElementById('admin-auth-guard')?.classList.toggle('flex', !isAuthed);
  document.getElementById('admin-dashboard-content')?.classList.toggle('hidden', !isAuthed);

  const banner = document.getElementById('auth-error-banner');
  if (banner) {
    banner.textContent = errMsg || 'Email atau kata sandi tidak valid.';
    banner.classList.toggle('hidden', !errMsg);
  }

  if (isAuthed && user) {
    const lbl = document.getElementById('admin-identity-label');
    if (lbl) lbl.textContent = `Staf Redaksi: ${user.name || user.email}`;
    fetchKPI();
    fetchOrders();
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
      const navBadge = document.getElementById('nav-admin-badge');
      if (elTotal) elTotal.textContent = String(kpi.totalOrders);
      if (elWaiting) elWaiting.textContent = String(kpi.waitingVerification);
      if (elActive) elActive.textContent = formatRp(kpi.totalActiveValue);
      if (navBadge) navBadge.textContent = String(kpi.waitingVerification ?? 0);
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
    tbody.innerHTML = '<tr><td colspan="7" class="px-4 py-8 text-center text-rose-500 font-bold">Gagal memuat data dari server backend.</td></tr>';
  }
}

export function initAdminController() {
  document.getElementById('admin-login-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = (document.getElementById('admin-email') as HTMLInputElement)?.value;
    const pass = (document.getElementById('admin-password') as HTMLInputElement)?.value;
    handleAdminLogin(email, pass);
  });

  document.getElementById('btn-admin-logout')?.addEventListener('click', async () => {
    try { await fetch(`${API_BASE}/admin/logout`, { method: 'POST', credentials: 'include' }); } catch {}
    localStorage.removeItem(ADMIN_STORAGE_KEY);
    currentAdminToken = '';
    showAdminToast('Sesi redaksi telah diakhiri.');
    setTimeout(() => location.reload(), 500);
  });

  (window as any).updateOrderStatus = async function (orderCode: string, newStatus: string) {
    if (newStatus === 'Diproses') {
      const ok = confirm(`Konfirmasi Verifikasi Pembayaran:\n\nApakah pembayaran ${orderCode} telah diverifikasi?\n\nStatus "Diproses" akan membuka berkas naskah bagi redaksi dan mengunci hak penarikan penulis.`);
      if (!ok) { fetchOrders(); return; }
    }
    try {
      const res = await fetch(`${API_BASE}/orders/${orderCode}/status`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        showAdminToast(`Status ${orderCode} diubah ke "${newStatus}".`);
        fetchKPI(); fetchOrders();
      } else {
        const err = await res.json();
        alert(err.error || 'Gagal memperbarui status');
        fetchOrders();
      }
    } catch {
      alert('Gagal menghubungi server');
    }
  };

  const tabs = document.querySelectorAll('.admin-tab');
  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      tabs.forEach((t) => {
        t.classList.remove('bg-navy', 'text-white');
        t.classList.add('bg-white', 'text-slate-600', 'border', 'border-slate-200');
      });
      tab.classList.remove('bg-white', 'text-slate-600', 'border', 'border-slate-200');
      tab.classList.add('bg-navy', 'text-white');
      activeFilter = tab.getAttribute('data-filter') || 'ALL';
      const tbody = document.getElementById('orders-tbody');
      if (tbody) renderOrdersTable(tbody, allOrders, activeFilter, searchQuery);
    });
  });

  document.getElementById('admin-search-input')?.addEventListener('input', (e) => {
    searchQuery = (e.target as HTMLInputElement).value;
    const tbody = document.getElementById('orders-tbody');
    if (tbody) renderOrdersTable(tbody, allOrders, activeFilter, searchQuery);
  });

  document.getElementById('btn-refresh-admin')?.addEventListener('click', () => {
    fetchKPI(); fetchOrders();
    showAdminToast('Data pesanan disinkronkan kembali.');
  });

  checkAdminAuth();
}
