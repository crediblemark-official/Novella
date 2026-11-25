const API_BASE = typeof window !== 'undefined' && window.location.port === '4321' ? 'http://localhost:3001/api' : '/api';
const ADMIN_STORAGE_KEY = 'novella_admin_session';

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem(ADMIN_STORAGE_KEY) || '';
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) {
    h['Authorization'] = `Bearer ${token}`;
    h['x-admin-token'] = token;
  }
  return h;
}

export async function fetchAdminBooks(): Promise<void> {
  const tbody = document.getElementById('books-tbody');
  if (!tbody) return;
  try {
    const res = await fetch(`${API_BASE}/admin/books`, { headers: getAuthHeaders() });
    if (!res.ok) return;
    const books = await res.json();
    if (books.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" class="px-4 py-8 text-center text-slate-400">Belum ada buku terbitan.</td></tr>';
      return;
    }
    tbody.innerHTML = books
      .map(
        (b: any) => `
        <tr class="hover:bg-slate-50 transition-colors">
          <td class="px-4 py-3 font-extrabold text-navy">${b.title}</td>
          <td class="px-4 py-3 text-slate-600">${b.authorName}</td>
          <td class="px-4 py-3 text-slate-500">${b.category}</td>
          <td class="px-4 py-3 text-slate-500">${b.pages} hal · ${b.bookSize}</td>
          <td class="px-4 py-3 text-right">
            <button onclick="window.deleteBookItem(${b.id})" class="text-xs font-bold text-rose-600 hover:text-rose-800 cursor-pointer">Hapus</button>
          </td>
        </tr>
      `
      )
      .join('');
  } catch {}
}

export async function createAdminBook(payload: any, showToast: (m: string) => void): Promise<void> {
  try {
    const res = await fetch(`${API_BASE}/admin/books`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      showToast('Buku terbitan berhasil ditambahkan!');
      fetchAdminBooks();
    }
  } catch {}
}

export async function deleteAdminBook(id: number, showToast: (m: string) => void): Promise<void> {
  if (!confirm('Hapus buku terbitan ini dari showcase publik?')) return;
  try {
    const res = await fetch(`${API_BASE}/admin/books/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
    if (res.ok) {
      showToast('Buku terbitan dihapus.');
      fetchAdminBooks();
    }
  } catch {}
}

export async function fetchAdminTestimonials(): Promise<void> {
  const tbody = document.getElementById('testimonials-tbody');
  if (!tbody) return;
  try {
    const res = await fetch(`${API_BASE}/admin/testimonials`, { headers: getAuthHeaders() });
    if (!res.ok) return;
    const list = await res.json();
    if (list.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4" class="px-4 py-8 text-center text-slate-400">Belum ada testimoni.</td></tr>';
      return;
    }
    tbody.innerHTML = list
      .map(
        (t: any) => `
        <tr class="hover:bg-slate-50 transition-colors">
          <td class="px-4 py-3 font-extrabold text-navy">${t.authorName}</td>
          <td class="px-4 py-3 text-slate-500">${t.roleOrCity}</td>
          <td class="px-4 py-3 text-slate-700 italic max-w-[280px] truncate" title="${t.quote}">"${t.quote}"</td>
          <td class="px-4 py-3 text-right">
            <button onclick="window.deleteTestimonialItem(${t.id})" class="text-xs font-bold text-rose-600 hover:text-rose-800 cursor-pointer">Hapus</button>
          </td>
        </tr>
      `
      )
      .join('');
  } catch {}
}

export async function createAdminTestimonial(payload: any, showToast: (m: string) => void): Promise<void> {
  try {
    const res = await fetch(`${API_BASE}/admin/testimonials`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      showToast('Testimoni berhasil ditambahkan!');
      fetchAdminTestimonials();
    }
  } catch {}
}

export async function deleteAdminTestimonial(id: number, showToast: (m: string) => void): Promise<void> {
  if (!confirm('Hapus testimoni ini?')) return;
  try {
    const res = await fetch(`${API_BASE}/admin/testimonials/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
    if (res.ok) {
      showToast('Testimoni dihapus.');
      fetchAdminTestimonials();
    }
  } catch {}
}

export function bindAdminShowcaseEvents(showToast: (m: string) => void): void {
  document.getElementById('btn-toggle-add-book')?.addEventListener('click', () => {
    document.getElementById('add-book-form')?.classList.toggle('hidden');
  });
  document.getElementById('add-book-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const title = (document.getElementById('book-title-input') as HTMLInputElement)?.value;
    const authorName = (document.getElementById('book-author-input') as HTMLInputElement)?.value;
    const category = (document.getElementById('book-category-input') as HTMLInputElement)?.value;
    const pages = Number((document.getElementById('book-pages-input') as HTMLInputElement)?.value || 100);
    const bookSize = (document.getElementById('book-size-input') as HTMLInputElement)?.value || 'A5';
    createAdminBook({ title, authorName, category, pages, bookSize }, showToast);
    (document.getElementById('add-book-form') as HTMLFormElement).reset();
    document.getElementById('add-book-form')?.classList.add('hidden');
  });

  document.getElementById('btn-toggle-add-testi')?.addEventListener('click', () => {
    document.getElementById('add-testi-form')?.classList.toggle('hidden');
  });
  document.getElementById('add-testi-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const authorName = (document.getElementById('testi-author-input') as HTMLInputElement)?.value;
    const roleOrCity = (document.getElementById('testi-role-input') as HTMLInputElement)?.value;
    const quote = (document.getElementById('testi-quote-input') as HTMLTextAreaElement)?.value;
    createAdminTestimonial({ authorName, roleOrCity, quote }, showToast);
    (document.getElementById('add-testi-form') as HTMLFormElement).reset();
    document.getElementById('add-testi-form')?.classList.add('hidden');
  });
}
