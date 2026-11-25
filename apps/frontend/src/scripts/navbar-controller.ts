const API_URL = '/api';
const AUTH_KEY = 'novella_auth_user';

export function renderNavUser(user: any) {
  const guestLinks = document.getElementById('nav-guest-links');
  const container = document.getElementById('nav-user-container');
  const pillName = document.getElementById('nav-user-name');
  const pillAvatar = document.getElementById('nav-user-avatar');
  const dispName = document.getElementById('user-display-name');
  const dispAvatar = document.getElementById('user-avatar');
  const dispEmail = document.getElementById('user-display-email');

  if (guestLinks) guestLinks.classList.add('hidden');
  if (container) container.classList.remove('hidden');

  const name = user.name || 'Penulis';
  const initial = name[0].toUpperCase();
  if (pillName) pillName.textContent = name;
  if (pillAvatar) pillAvatar.textContent = initial;
  if (dispName) dispName.textContent = name;
  if (dispAvatar) dispAvatar.textContent = initial;
  if (dispEmail) {
    dispEmail.textContent = user.email + (user.phone ? ' · ' + user.phone : '');
  }
}

export function initNavbarController() {
  const isLoggedOut = typeof window !== 'undefined' && window.location.search.includes('logged_out=1');
  const pillBtn = document.getElementById('nav-user-pill');
  const dropdown = document.getElementById('nav-user-dropdown');
  const chevron = document.getElementById('nav-user-chevron');

  function toggleDropdown(show?: boolean) {
    if (!dropdown) return;
    const target = show !== undefined ? show : dropdown.classList.contains('hidden');
    dropdown.classList.toggle('hidden', !target);
    chevron?.classList.toggle('rotate-180', target);
    pillBtn?.setAttribute('aria-expanded', String(target));
  }

  pillBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleDropdown();
  });

  document.addEventListener('click', (e) => {
    if (dropdown && !dropdown.contains(e.target as Node) && !pillBtn?.contains(e.target as Node)) {
      toggleDropdown(false);
    }
  });

  document.getElementById('toggle-history-btn')?.addEventListener('click', () => {
    toggleDropdown(false);
    const box = document.getElementById('history-box');
    if (box) {
      box.classList.toggle('hidden');
      box.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } else {
      window.location.href = '/portal';
    }
  });

  document.getElementById('logout-btn')?.addEventListener('click', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('logout-btn');
    btn?.setAttribute('disabled', 'true');
    const span = btn?.querySelector('span');
    if (span) span.textContent = 'Keluar...';

    try {
      const c = new AbortController();
      const t = setTimeout(() => c.abort(), 1500);
      await fetch(`${API_URL}/auth/sign-out`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        signal: c.signal,
      });
      clearTimeout(t);
    } catch {}

    localStorage.removeItem(AUTH_KEY);
    sessionStorage.removeItem('novella_portal_draft');
    window.location.replace('/login?logged_out=1');
  });

  if (isLoggedOut) {
    localStorage.removeItem(AUTH_KEY);
  } else {
    const cached = localStorage.getItem(AUTH_KEY);
    if (cached) {
      try {
        const u = JSON.parse(cached);
        if (u?.name) renderNavUser(u);
      } catch {}
    }
  }

  // Sync Better Auth session if present
  (async () => {
    if (!isLoggedOut) {
      try {
        const res = await fetch(`${API_URL}/auth/get-session`, { credentials: 'include' });
        if (res.ok) {
          const session = await res.json();
          if (session?.user) {
            localStorage.setItem(AUTH_KEY, JSON.stringify(session.user));
            renderNavUser(session.user);
          }
        }
      } catch {}
    }
  })();
}
