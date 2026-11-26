import { formatBytes } from '../../utils/formatters';
import { calcState, bookState, portalState, loadDraftState } from './state';
import { API_BASE, showToast } from './api';
import { getStepFromUrl, setStep } from './router';
import { loadAuthorOrders } from './orders';

export const AUTH_USER_KEY = 'novella_auth_user';

export function updateUserUI() {
  const u = portalState.currentUser;
  if (!u) return;
  const name = u.name || 'Penulis Novella';
  const initial = (name || 'P')[0].toUpperCase();
  const setTxt = (id: string, v: string) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  setTxt('user-avatar', initial);
  setTxt('user-display-name', name);
  setTxt('nav-user-avatar', initial);
  setTxt('nav-user-name', name);
  setTxt('user-display-email', u.email + (u.phone ? ' · ' + u.phone : ''));
  document.getElementById('nav-user-container')?.classList.remove('hidden');
  document.getElementById('nav-guest-links')?.classList.add('hidden');
}

export function showProfileCard() {
  document.getElementById('profile-card')?.classList.remove('hidden');
  document.getElementById('wizard-container')?.classList.add('hidden');
  const cancelBtn = document.getElementById('btn-cancel-profile');
  if (cancelBtn) {
    const hasProfile = Boolean(portalState.currentUser?.phone && portalState.currentUser?.address);
    cancelBtn.classList.toggle('hidden', !hasProfile);
  }
}

export function showWizard(initialStep = 1) {
  document.getElementById('profile-card')?.classList.add('hidden');
  document.getElementById('wizard-container')?.classList.remove('hidden');
  setStep(initialStep, false);
}

function populateProfileFields() {
  const phoneEl = document.getElementById('input-phone') as HTMLInputElement | null;
  const addrEl = document.getElementById('input-address') as HTMLTextAreaElement | null;
  if (phoneEl && portalState.currentUser?.phone) phoneEl.value = portalState.currentUser.phone.replace(/^(\+?62|0)/, '');
  if (addrEl && portalState.currentUser?.address) addrEl.value = portalState.currentUser.address;
}

function restoreDraftInputs() {
  const setVal = (id: string, v?: string | number) => {
    const el = document.getElementById(id) as HTMLInputElement | HTMLSelectElement | null;
    if (el && v) el.value = String(v);
  };
  setVal('input-pages', calcState.pages);
  setVal('input-copies', calcState.copies);
  setVal('input-book-title', bookState.title);
  const catEl = document.getElementById('select-book-category') as HTMLSelectElement | null;
  if (catEl) {
    const ok = Array.from(catEl.options).some((o) => o.value === bookState.category);
    catEl.value = ok ? bookState.category : (catEl.options[0]?.value || 'Novel Sastra');
    bookState.category = catEl.value;
  }

  if (bookState.uploadedFileName) {
    const nameEl = document.getElementById('file-name-label');
    const sizeEl = document.getElementById('file-size-label');
    const msgEl = document.getElementById('file-upload-msg');
    if (nameEl) nameEl.textContent = bookState.uploadedFileOriginalName || bookState.uploadedFileName;
    if (sizeEl) sizeEl.textContent = formatBytes(bookState.uploadedFileSize);
    document.getElementById('file-status-box')?.classList.remove('hidden');
    if (msgEl) {
      msgEl.textContent = 'Naskah sebelumnya sudah diunggah!';
      msgEl.className = 'mt-1 text-[11px] font-bold text-emerald-600';
    }
  }
}

function applyUserSession(user: any) {
  if (!user) return;
  const curr = portalState.currentUser || {};
  const merged = { ...curr, ...user, phone: user.phone || curr.phone || null, address: user.address || curr.address || null };
  portalState.currentUser = merged;
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(merged));
  updateUserUI();

  document.getElementById('portal-loading')?.classList.add('hidden');
  document.getElementById('portal-main-content')?.classList.remove('hidden');

  const isEditing = typeof window !== 'undefined' && window.location.search.includes('edit_profile=1');
  if (merged.phone && merged.address && !isEditing) {
    showWizard(getStepFromUrl());
    loadAuthorOrders();
    restoreDraftInputs();
  } else {
    populateProfileFields();
    showProfileCard();
  }
}

async function syncUserWithDatabase(email: string) {
  try {
    const res = await fetch(`${API_BASE}/auth/user?email=${encodeURIComponent(email)}`, { credentials: 'include' });
    if (res.ok) {
      const data = await res.json();
      if (data.user) applyUserSession(data.user);
    }
  } catch {}
}

export function bindAuthEvents() {
  const profileForm = document.getElementById('profile-complete-form') as HTMLFormElement | null;
  const cancelBtn = document.getElementById('btn-cancel-profile');
  const logoutBtn = document.getElementById('logout-btn');

  cancelBtn?.addEventListener('click', () => {
    if (portalState.currentUser?.phone && portalState.currentUser?.address) showWizard(getStepFromUrl());
  });

  profileForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const rawPhone = (document.getElementById('input-phone') as HTMLInputElement)?.value.trim() || '';
    const address = (document.getElementById('input-address') as HTMLTextAreaElement)?.value.trim() || '';
    if (!rawPhone || !address) { showToast('Mohon lengkapi nomor WhatsApp dan alamat pengiriman.'); return; }

    const digits = rawPhone.replace(/[^0-9]/g, '');
    const phone = digits.startsWith('0') ? digits : (digits.startsWith('62') ? '0' + digits.slice(2) : '0' + digits);
    const userEmail = portalState.currentUser?.email || (JSON.parse(localStorage.getItem(AUTH_USER_KEY) || '{}')).email;
    if (!userEmail) { showToast('Sesi masuk tidak ditemukan. Silakan login kembali.'); return; }

    try {
      const res = await fetch(`${API_BASE}/auth/profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: userEmail, phone, address }),
      });
      const data = await res.json();
      applyUserSession(data.user);
      showToast('Profil pengiriman berhasil disimpan!');
    } catch {
      showToast('Gagal menyimpan profil.');
    }
  });

  logoutBtn?.addEventListener('click', async (e) => {
    e.preventDefault();
    logoutBtn.setAttribute('disabled', 'true');
    const span = logoutBtn.querySelector('span');
    if (span) span.textContent = 'Keluar...';

    try {
      const c = new AbortController();
      const t = setTimeout(() => c.abort(), 1500);
      await fetch(`${API_BASE}/auth/sign-out`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', signal: c.signal });
      clearTimeout(t);
    } catch {}

    localStorage.removeItem(AUTH_USER_KEY);
    sessionStorage.removeItem('novella_portal_draft');
    portalState.currentUser = null;
    window.location.replace('/login?logged_out=1');
  });
}

export async function restoreSession() {
  loadDraftState();
  const PANEL_URL = typeof window !== 'undefined' && window.location.port === '4321' ? 'http://localhost:4323' : 'https://panel.novella.id';
  const cached = localStorage.getItem(AUTH_USER_KEY);
  if (cached) {
    try {
      const user = JSON.parse(cached);
      if (user?.email) {
        if (user.role === 'admin') { window.location.replace(PANEL_URL); return; }
        applyUserSession(user);
        syncUserWithDatabase(user.email);
        return;
      }
    } catch {}
  }

  try {
    const res = await fetch(`${API_BASE}/auth/get-session`, { credentials: 'include' });
    if (res.ok) {
      const sessionData = await res.json();
      if (sessionData?.user) {
        let fullUser = sessionData.user;
        try {
          const uRes = await fetch(`${API_BASE}/auth/user?email=${encodeURIComponent(sessionData.user.email)}`, { credentials: 'include' });
          if (uRes.ok) {
            const uData = await uRes.json();
            if (uData.user) fullUser = uData.user;
          }
        } catch {}

        if (fullUser.role === 'admin') {
          localStorage.setItem(AUTH_USER_KEY, JSON.stringify(fullUser));
          window.location.replace(PANEL_URL);
          return;
        }

        applyUserSession(fullUser);
        return;
      }
    }
  } catch (err) {
    console.warn('Could not restore session:', err);
  }

  window.location.replace('/login');
}
