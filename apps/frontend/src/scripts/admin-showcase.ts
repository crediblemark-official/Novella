import { openConfirmDialog } from './admin-dialogs';

const API_BASE = typeof window !== 'undefined' && window.location.port === '4321' ? 'http://localhost:3001/api' : '/api';
const ADMIN_STORAGE_KEY = 'novella_admin_session';
const trashSvg = '<svg class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>';

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem(ADMIN_STORAGE_KEY) || '';
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) { h['Authorization'] = `Bearer ${token}`; h['x-admin-token'] = token; }
  return h;
}

export async function fetchAdminBooks(): Promise<void> {
  const tbody = document.getElementById('books-tbody');
  const countEl = document.getElementById('books-count');
  if (!tbody) return;
  try {
    const res = await fetch(`${API_BASE}/admin/books`, { headers: getAuthHeaders() });
    if (!res.ok) return;
    const books = await res.json();
    if (countEl) countEl.textContent = `${books.length} buku terbitan`;
    if (books.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" class="px-4 py-8 text-center text-slate-500">Belum ada buku terbitan.</td></tr>';
      return;
    }
    tbody.innerHTML = books.map((b: any) => `
      <tr class="hover:bg-slate-50/70 transition-colors align-middle">
        <td class="px-4 py-3 sm:pl-6 font-bold text-navy align-middle whitespace-nowrap">${b.title}</td>
        <td class="px-4 py-3 text-slate-600 align-middle whitespace-nowrap">${b.category}</td>
        <td class="px-4 py-3 font-semibold text-slate-700 align-middle whitespace-nowrap">${b.authorName}</td>
        <td class="px-4 py-3 font-mono text-[11px] text-slate-600 align-middle whitespace-nowrap">${b.pages} hal · ${b.bookSize}</td>
        <td class="px-4 py-3 sm:pr-6 text-right align-middle whitespace-nowrap">
          <button type="button" onclick="window.deleteBookItem(${b.id})" class="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 cursor-pointer transition-colors" title="Hapus buku" aria-label="Hapus buku">${trashSvg}</button>
        </td>
      </tr>`).join('');
  } catch {}
}

export async function createAdminBook(payload: any, showToast: (m: string) => void): Promise<void> {
  try {
    const res = await fetch(`${API_BASE}/admin/books`, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(payload) });
    if (res.ok) { showToast('Buku terbitan ditambahkan.'); fetchAdminBooks(); }
  } catch {}
}

export async function deleteAdminBook(id: number, showToast: (m: string) => void): Promise<void> {
  if (!(await openConfirmDialog('Hapus Buku', 'Hapus buku terbitan ini dari showcase publik?', 'Hapus', true))) return;
  try {
    const res = await fetch(`${API_BASE}/admin/books/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
    if (res.ok) { showToast('Buku terbitan dihapus.'); fetchAdminBooks(); }
  } catch {}
}

export async function fetchAdminTestimonials(): Promise<void> {
  const tbody = document.getElementById('testimonials-tbody');
  const countEl = document.getElementById('testimonials-count');
  if (!tbody) return;
  try {
    const res = await fetch(`${API_BASE}/admin/testimonials`, { headers: getAuthHeaders() });
    if (!res.ok) return;
    const list = await res.json();
    if (countEl) countEl.textContent = `${list.length} testimoni aktif`;
    if (list.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4" class="px-4 py-8 text-center text-slate-500">Belum ada testimoni.</td></tr>';
      return;
    }
    tbody.innerHTML = list.map((t: any) => `
      <tr class="hover:bg-slate-50/70 transition-colors align-middle">
        <td class="px-4 py-3 sm:pl-6 font-bold text-navy align-middle whitespace-nowrap">${t.authorName}</td>
        <td class="px-4 py-3 text-slate-600 align-middle whitespace-nowrap">${t.roleOrCity}</td>
        <td class="px-4 py-3 text-slate-700 align-middle max-w-[420px]">
          <p class="line-clamp-2 italic" title="${t.quote}">"${t.quote}"</p>
        </td>
        <td class="px-4 py-3 sm:pr-6 text-right align-middle whitespace-nowrap">
          <button type="button" onclick="window.deleteTestimonialItem(${t.id})" class="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 cursor-pointer transition-colors" title="Hapus testimoni" aria-label="Hapus testimoni">${trashSvg}</button>
        </td>
      </tr>`).join('');
  } catch {}
}

export async function createAdminTestimonial(payload: any, showToast: (m: string) => void): Promise<void> {
  try {
    const res = await fetch(`${API_BASE}/admin/testimonials`, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(payload) });
    if (res.ok) { showToast('Testimoni ditambahkan.'); fetchAdminTestimonials(); }
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
  document.getElementById('btn-toggle-add-book')?.addEventListener('click', () => document.getElementById('add-book-form')?.classList.toggle('hidden'));
  document.getElementById('btn-toggle-add-testi')?.addEventListener('click', () => document.getElementById('add-testi-form')?.classList.toggle('hidden'));

  document.getElementById('add-book-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    await createAdminBook({
      title: (document.getElementById('book-title-input') as HTMLInputElement).value.trim(),
      authorName: (document.getElementById('book-author-input') as HTMLInputElement).value.trim(),
      category: (document.getElementById('book-category-input') as HTMLInputElement).value.trim(),
      pages: Number((document.getElementById('book-pages-input') as HTMLInputElement).value),
      bookSize: (document.getElementById('book-size-input') as HTMLInputElement).value.trim(),
    }, showToast);
    (e.target as HTMLFormElement).reset();
    document.getElementById('add-book-form')?.classList.add('hidden');
  });

  document.getElementById('add-testi-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    await createAdminTestimonial({
      authorName: (document.getElementById('testi-author-input') as HTMLInputElement).value.trim(),
      roleOrCity: (document.getElementById('testi-role-input') as HTMLInputElement).value.trim(),
      quote: (document.getElementById('testi-quote-input') as HTMLTextAreaElement).value.trim(),
    }, showToast);
    (e.target as HTMLFormElement).reset();
    document.getElementById('add-testi-form')?.classList.add('hidden');
  });
}
