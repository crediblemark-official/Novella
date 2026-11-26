import { openConfirmDialog } from './admin-dialogs';

const API_BASE = typeof window !== 'undefined' && (window.location.port === '4323' || window.location.port === '4321') ? 'http://localhost:3001/api' : (import.meta.env.PUBLIC_API_BASE || '/api');
const KATALOG_URL = typeof window !== 'undefined' && (window.location.port === '4323' || window.location.port === '4321') ? 'http://localhost:4322' : 'https://buku.novella.id';
const ADMIN_STORAGE_KEY = 'novella_admin_session';
const trashSvg = '<svg class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>';
const editSvg = '<svg class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>';
const extSvg = '<svg class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>';

let cachedAdminBooks: any[] = [];
let booksSearchQuery = '';
let cachedTestimonials: any[] = [];
let testiFilter: 'ALL' | 'PENDING' | 'ACTIVE' = 'ALL';
let testiSearchQuery = '';

function formatIdr(value?: number | null): string {
  if (!value || value <= 0) return '—';
  return 'Rp ' + Number(value).toLocaleString('id-ID');
}

function renderAdminBooksRows(): void {
  const tbody = document.getElementById('books-tbody');
  const countEl = document.getElementById('books-count');
  if (!tbody) return;

  const q = booksSearchQuery.trim().toLowerCase();
  const filtered = q
    ? cachedAdminBooks.filter(
        (b) =>
          (b.title || '').toLowerCase().includes(q) ||
          (b.authorName || '').toLowerCase().includes(q) ||
          (b.category || '').toLowerCase().includes(q) ||
          (b.isbn || '').toLowerCase().includes(q)
      )
    : cachedAdminBooks;

  if (countEl) countEl.textContent = `${filtered.length} buku terbitan`;
  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="px-4 py-8 text-center text-slate-500">Belum ada buku yang cocok.</td></tr>';
    return;
  }

  tbody.innerHTML = filtered.map((b: any) => `
    <tr class="hover:bg-slate-50/70 transition-colors align-middle">
      <td class="px-4 py-3 sm:pl-6 align-middle">
        <div class="font-bold text-navy">${b.title}</div>
        <div class="font-mono text-[10px] text-slate-400">${b.isbn ? `ISBN ${b.isbn}` : (b.slug || '')}</div>
      </td>
      <td class="px-4 py-3 text-slate-600 align-middle whitespace-nowrap">${b.category}</td>
      <td class="px-4 py-3 font-semibold text-slate-700 align-middle whitespace-nowrap">${b.authorName}</td>
      <td class="px-4 py-3 font-mono text-[11px] text-slate-600 align-middle whitespace-nowrap">
        <div>${b.pages} hal · ${b.bookSize}${b.publishedYear ? ` · ${b.publishedYear}` : ''}</div>
        <div class="font-bold text-navy">${formatIdr(b.price)}</div>
      </td>
      <td class="px-4 py-3 align-middle whitespace-nowrap">
        <span class="inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${b.isPublished ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500 border border-slate-200'}">${b.isPublished ? 'Tayang' : 'Draft'}</span>
      </td>
      <td class="px-4 py-3 sm:pr-6 text-right align-middle whitespace-nowrap">
        <div class="inline-flex items-center gap-1.5">
          <a href="${KATALOG_URL}/buku?slug=${encodeURIComponent(b.slug || String(b.id))}" target="_blank" rel="noopener noreferrer" class="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:border-navy hover:text-navy transition-colors" title="Lihat di buku.novella.id">${extSvg}</a>
          <a href="/katalog/form?id=${b.id}" class="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-navy hover:bg-slate-100 transition-colors" title="Edit buku" aria-label="Edit buku">${editSvg}</a>
          <button type="button" onclick="window.deleteBookItem(${b.id})" class="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 cursor-pointer transition-colors" title="Hapus buku" aria-label="Hapus buku">${trashSvg}</button>
        </div>
      </td>
    </tr>`).join('');
}

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem(ADMIN_STORAGE_KEY) || '';
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) { h['Authorization'] = `Bearer ${token}`; h['x-admin-token'] = token; }
  return h;
}

export async function fetchAdminBooks(): Promise<void> {
  const tbody = document.getElementById('books-tbody');
  if (!tbody) return;
  try {
    const res = await fetch(`${API_BASE}/admin/books`, { headers: getAuthHeaders() });
    if (!res.ok) return;
    cachedAdminBooks = await res.json();
    renderAdminBooksRows();
  } catch {}
}

export async function deleteAdminBook(id: number, showToast: (m: string) => void): Promise<void> {
  if (!(await openConfirmDialog('Hapus Buku', 'Hapus buku terbitan ini dari showcase publik?', 'Hapus', true))) return;
  try {
    const res = await fetch(`${API_BASE}/admin/books/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
    if (res.ok) { showToast('Buku terbitan dihapus.'); fetchAdminBooks(); }
  } catch {}
}

function renderStarIcons(rating: number): string {
  const score = Math.min(5, Math.max(1, Number(rating) || 5));
  const starPath = 'M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z';
  return `<div class="inline-flex items-center gap-0.5" title="${score}/5">${[1, 2, 3, 4, 5]
    .map((i) => `<svg class="h-3.5 w-3.5 ${i <= score ? 'text-amber-400' : 'text-slate-200'}" fill="currentColor" viewBox="0 0 20 20"><path d="${starPath}"/></svg>`)
    .join('')}</div>`;
}

function renderAdminTestimonialsRows(): void {
  const tbody = document.getElementById('testimonials-tbody');
  const countEl = document.getElementById('testimonials-count');
  if (!tbody) return;

  const activeCount = cachedTestimonials.filter((t) => t.isActive).length;
  const pendingCount = cachedTestimonials.length - activeCount;
  if (countEl) {
    countEl.textContent = `${cachedTestimonials.length} testimoni (${activeCount} tayang${pendingCount > 0 ? `, ${pendingCount} menunggu` : ''})`;
  }

  let list = [...cachedTestimonials];
  if (testiFilter === 'PENDING') list = list.filter((t) => !t.isActive);
  else if (testiFilter === 'ACTIVE') list = list.filter((t) => t.isActive);

  const q = testiSearchQuery.trim().toLowerCase();
  if (q) {
    list = list.filter(
      (t) =>
        (t.authorName || '').toLowerCase().includes(q) ||
        (t.roleOrCity || '').toLowerCase().includes(q) ||
        (t.quote || '').toLowerCase().includes(q)
    );
  }

  if (list.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="px-4 py-8 text-center text-slate-500">Belum ada testimoni yang cocok.</td></tr>';
    return;
  }

  tbody.innerHTML = list.map((t: any) => `
    <tr class="hover:bg-slate-50/70 transition-colors align-middle">
      <td class="px-4 py-3 sm:pl-6 font-bold text-navy align-middle whitespace-nowrap">${t.authorName}</td>
      <td class="px-4 py-3 text-slate-600 align-middle whitespace-nowrap">${t.roleOrCity}</td>
      <td class="px-4 py-3 align-middle whitespace-nowrap">${renderStarIcons(t.rating || 5)}</td>
      <td class="px-4 py-3 text-slate-700 align-middle max-w-[360px]">
        <p class="line-clamp-2 italic" title="${t.quote}">"${t.quote}"</p>
      </td>
      <td class="px-4 py-3 align-middle whitespace-nowrap">
        <span class="inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${t.isActive ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}">${t.isActive ? 'Tayang' : 'Menunggu'}</span>
      </td>
      <td class="px-4 py-3 sm:pr-6 text-right align-middle whitespace-nowrap">
        <div class="inline-flex items-center gap-1.5">
          <button type="button" onclick="window.toggleTestimonialStatus(${t.id}, ${!t.isActive})" class="inline-flex h-8 items-center rounded-lg border px-2.5 text-[11px] font-bold cursor-pointer transition-colors ${t.isActive ? 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100' : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}">${t.isActive ? 'Sembunyikan' : 'Tayangkan'}</button>
          <button type="button" onclick="window.editTestimonialItem(${t.id})" class="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-navy hover:bg-slate-100 cursor-pointer transition-colors" title="Edit testimoni" aria-label="Edit testimoni">${editSvg}</button>
          <button type="button" onclick="window.deleteTestimonialItem(${t.id})" class="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 cursor-pointer transition-colors" title="Hapus testimoni" aria-label="Hapus testimoni">${trashSvg}</button>
        </div>
      </td>
    </tr>`).join('');
}

export async function fetchAdminTestimonials(): Promise<void> {
  const tbody = document.getElementById('testimonials-tbody');
  if (!tbody) return;
  try {
    const res = await fetch(`${API_BASE}/admin/testimonials`, { headers: getAuthHeaders() });
    if (!res.ok) return;
    cachedTestimonials = await res.json();
    renderAdminTestimonialsRows();
  } catch {}
}

export async function saveAdminTestimonial(id: number | null, payload: any, showToast: (m: string) => void): Promise<void> {
  try {
    const url = id ? `${API_BASE}/admin/testimonials/${id}` : `${API_BASE}/admin/testimonials`;
    const method = id ? 'PATCH' : 'POST';
    const res = await fetch(url, { method, headers: getAuthHeaders(), body: JSON.stringify(payload) });
    if (res.ok) {
      showToast(id ? 'Testimoni diperbarui.' : 'Testimoni ditambahkan.');
      fetchAdminTestimonials();
    }
  } catch {}
}

export async function toggleAdminTestimonial(id: number, isActive: boolean, showToast: (m: string) => void): Promise<void> {
  try {
    const res = await fetch(`${API_BASE}/admin/testimonials/${id}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ isActive }),
    });
    if (res.ok) {
      showToast(isActive ? 'Testimoni ditayangkan.' : 'Testimoni disembunyikan.');
      fetchAdminTestimonials();
    }
  } catch {}
}

export async function deleteAdminTestimonial(id: number, showToast: (m: string) => void): Promise<void> {
  if (!(await openConfirmDialog('Hapus Testimoni', 'Hapus testimoni ini dari halaman beranda?', 'Hapus', true))) return;
  try {
    const res = await fetch(`${API_BASE}/admin/testimonials/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
    if (res.ok) { showToast('Testimoni dihapus.'); fetchAdminTestimonials(); }
  } catch {}
}

export function bindAdminShowcaseEvents(showToast: (m: string) => void): void {
  const testiDlg = document.getElementById('dlg-admin-testimonial') as HTMLDialogElement | null;
  const testiForm = document.getElementById('add-testi-form') as HTMLFormElement | null;

  const setModalRating = (val: number) => {
    const score = Math.min(5, Math.max(1, val || 5));
    const input = document.getElementById('testi-rating-input') as HTMLInputElement | null;
    if (input) input.value = String(score);
    document.querySelectorAll('#testi-rating-stars .testi-star-btn svg').forEach((svg, idx) => {
      svg.classList.toggle('text-amber-400', idx < score);
      svg.classList.toggle('text-slate-200', idx >= score);
    });
  };

  document.querySelectorAll('#testi-rating-stars .testi-star-btn').forEach((btn) => {
    btn.addEventListener('click', () => setModalRating(Number(btn.getAttribute('data-star-val'))));
  });

  const openTestiModal = (item?: any) => {
    testiForm?.reset();
    (document.getElementById('testi-id-input') as HTMLInputElement).value = item ? String(item.id) : '';
    (document.getElementById('testi-modal-title') as HTMLElement).textContent = item ? 'Edit Testimoni' : 'Tambah Testimoni';
    if (item) {
      (document.getElementById('testi-author-input') as HTMLInputElement).value = item.authorName || '';
      (document.getElementById('testi-role-input') as HTMLInputElement).value = item.roleOrCity || '';
      setModalRating(Number(item.rating || 5));
      (document.getElementById('testi-quote-input') as HTMLTextAreaElement).value = item.quote || '';
      (document.getElementById('testi-active-input') as HTMLInputElement).checked = Boolean(item.isActive);
    } else {
      setModalRating(5);
      (document.getElementById('testi-active-input') as HTMLInputElement).checked = true;
    }
    testiDlg?.showModal();
  };

  (window as any).toggleTestimonialStatus = (id: number, nextActive: boolean) => toggleAdminTestimonial(id, nextActive, showToast);
  (window as any).editTestimonialItem = (id: number) => {
    const found = cachedTestimonials.find((t) => t.id === id);
    if (found) openTestiModal(found);
  };

  const openSiteLink = document.getElementById('btn-open-katalog-site') as HTMLAnchorElement | null;
  if (openSiteLink) openSiteLink.href = KATALOG_URL;

  document.getElementById('books-search-input')?.addEventListener('input', (e) => {
    booksSearchQuery = (e.target as HTMLInputElement).value;
    renderAdminBooksRows();
  });

  document.getElementById('testi-search-input')?.addEventListener('input', (e) => {
    testiSearchQuery = (e.target as HTMLInputElement).value;
    renderAdminTestimonialsRows();
  });

  document.querySelectorAll('.testi-filter-pill').forEach((btn) => {
    btn.addEventListener('click', () => {
      testiFilter = (btn.getAttribute('data-testi-filter') || 'ALL') as any;
      document.querySelectorAll('.testi-filter-pill').forEach((p) => {
        const on = p === btn;
        p.classList.toggle('bg-navy', on);
        p.classList.toggle('text-white', on);
        p.classList.toggle('bg-white', !on);
        p.classList.toggle('text-slate-600', !on);
        p.classList.toggle('border', !on);
        p.classList.toggle('border-slate-200', !on);
      });
      renderAdminTestimonialsRows();
    });
  });

  document.getElementById('btn-toggle-add-testi')?.addEventListener('click', () => openTestiModal());
  document.getElementById('dlg-admin-testi-close')?.addEventListener('click', () => testiDlg?.close());
  document.getElementById('dlg-admin-testi-cancel')?.addEventListener('click', () => testiDlg?.close());

  testiForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const editId = (document.getElementById('testi-id-input') as HTMLInputElement).value.trim();
    await saveAdminTestimonial(
      editId ? Number(editId) : null,
      {
        authorName: (document.getElementById('testi-author-input') as HTMLInputElement).value.trim(),
        roleOrCity: (document.getElementById('testi-role-input') as HTMLInputElement).value.trim(),
        rating: Number((document.getElementById('testi-rating-input') as HTMLInputElement).value) || 5,
        quote: (document.getElementById('testi-quote-input') as HTMLTextAreaElement).value.trim(),
        isActive: (document.getElementById('testi-active-input') as HTMLInputElement).checked,
      },
      showToast
    );
    testiDlg?.close();
  });
}
