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

  const mobGuest = document.getElementById('mobile-guest-links');
  const mobUser = document.getElementById('mobile-user-section');
  const mobLogout = document.getElementById('mobile-logout-btn');
  const mobAvatar = document.getElementById('mobile-user-avatar');
  const mobName = document.getElementById('mobile-user-name');
  const mobEmail = document.getElementById('mobile-user-email');

  if (guestLinks) guestLinks.classList.add('hidden');
  if (container) container.classList.remove('hidden');
  if (mobGuest) mobGuest.classList.add('hidden');
  if (mobUser) mobUser.classList.remove('hidden');
  if (mobLogout) mobLogout.classList.remove('hidden');

  const name = user.name || 'Penulis';
  const initial = name[0].toUpperCase();
  const subText = user.email + (user.phone ? ' · ' + user.phone : '');
  if (pillName) pillName.textContent = name;
  if (pillAvatar) pillAvatar.textContent = initial;
  if (dispName) dispName.textContent = name;
  if (dispAvatar) dispAvatar.textContent = initial;
  if (dispEmail) dispEmail.textContent = subText;
  if (mobName) mobName.textContent = name;
  if (mobAvatar) mobAvatar.textContent = initial;
  if (mobEmail) mobEmail.textContent = subText;

  const isAdmin = user.role === 'admin' || Boolean(localStorage.getItem('novella_admin_session'));
  if (isAdmin) {
    document.getElementById('nav-dropdown-admin-link')?.classList.remove('hidden');
    document.getElementById('mobile-admin-link')?.classList.remove('hidden');
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

  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const mobileDrawer = document.getElementById('mobile-nav-drawer');
  const mobileBackdrop = document.getElementById('mobile-nav-backdrop');
  const mobileCloseBtn = document.getElementById('mobile-drawer-close');

  function toggleMobileDrawer(show?: boolean) {
    if (!mobileDrawer || !mobileBackdrop) return;
    const shouldOpen = show !== undefined ? show : mobileDrawer.classList.contains('translate-x-full');
    mobileDrawer.classList.toggle('translate-x-full', !shouldOpen);
    mobileBackdrop.classList.toggle('hidden', !shouldOpen);
    mobileMenuBtn?.setAttribute('aria-expanded', String(shouldOpen));
    document.body.classList.toggle('overflow-hidden', shouldOpen);
  }

  mobileMenuBtn?.addEventListener('click', () => toggleMobileDrawer(true));
  mobileCloseBtn?.addEventListener('click', () => toggleMobileDrawer(false));
  mobileBackdrop?.addEventListener('click', () => toggleMobileDrawer(false));
  document.querySelectorAll('.mobile-nav-link').forEach((el) => {
    el.addEventListener('click', () => toggleMobileDrawer(false));
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') toggleMobileDrawer(false);
  });

  const openHistory = () => {
    toggleDropdown(false);
    toggleMobileDrawer(false);
    if (window.location.pathname.startsWith('/portal') && document.getElementById('step-history')) {
      const card = document.getElementById('profile-card');
      const wizard = document.getElementById('wizard-container');
      if (card && wizard) {
        card.classList.add('hidden');
        wizard.classList.remove('hidden');
      }
      window.dispatchEvent(new CustomEvent('novella:navigate-step', { detail: { step: 3 } }));
    } else {
      window.location.href = '/portal/riwayat';
    }
  };

  const openEditProfile = () => {
    toggleDropdown(false);
    toggleMobileDrawer(false);
    if (window.location.pathname.startsWith('/portal')) {
      const card = document.getElementById('profile-card');
      const wizard = document.getElementById('wizard-container');
      const cancelBtn = document.getElementById('btn-cancel-profile');
      if (card && wizard) {
        card.classList.remove('hidden');
        wizard.classList.add('hidden');
        cancelBtn?.classList.remove('hidden');
        card.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } else {
      window.location.href = '/portal?edit_profile=1';
    }
  };

  const performLogout = async (e: Event) => {
    e.preventDefault();
    const btn = e.currentTarget as HTMLElement | null;
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
    localStorage.removeItem('novella_admin_session');
    sessionStorage.removeItem('novella_portal_draft');
    window.location.replace('/login?logged_out=1');
  };

  document.getElementById('toggle-history-btn')?.addEventListener('click', openHistory);
  document.getElementById('mobile-history-btn')?.addEventListener('click', openHistory);
  document.getElementById('nav-edit-profile-btn')?.addEventListener('click', openEditProfile);
  document.getElementById('mobile-edit-profile-btn')?.addEventListener('click', openEditProfile);
  document.getElementById('mobile-testimonial-btn')?.addEventListener('click', () => {
    toggleMobileDrawer(false);
    document.getElementById('nav-testimonial-btn')?.click();
  });
  document.getElementById('logout-btn')?.addEventListener('click', performLogout);
  document.getElementById('mobile-logout-btn')?.addEventListener('click', performLogout);

  if (isLoggedOut) {
    localStorage.removeItem(AUTH_KEY);
    localStorage.removeItem('novella_admin_session');
  } else {
    const cached = localStorage.getItem(AUTH_KEY);
    if (cached) {
      try {
        const u = JSON.parse(cached);
        if (u?.name) renderNavUser(u);
      } catch {}
    }
  }

  // Sync Better Auth session if present with database profile enrichment
  (async () => {
    if (!isLoggedOut) {
      try {
        const res = await fetch(`${API_URL}/auth/get-session`, { credentials: 'include' });
        if (res.ok) {
          const session = await res.json();
          if (session?.user?.email) {
            const cached = localStorage.getItem(AUTH_KEY);
            const prev = cached ? JSON.parse(cached) : {};
            let fullUser = session.user;
            try {
              const uRes = await fetch(`${API_URL}/auth/user?email=${encodeURIComponent(session.user.email)}`, {
                credentials: 'include',
              });
              if (uRes.ok) {
                const uData = await uRes.json();
                if (uData.user) fullUser = uData.user;
              }
            } catch {}
            const merged = {
              ...prev,
              ...fullUser,
              phone: fullUser.phone || prev.phone || null,
              address: fullUser.address || prev.address || null,
            };
            localStorage.setItem(AUTH_KEY, JSON.stringify(merged));
            renderNavUser(merged);
          }
        }
      } catch {}
    }
  })();
}
