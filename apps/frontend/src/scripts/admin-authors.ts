import { formatRp, syncTopScrollbar } from './admin-table';

const API_BASE = typeof window !== 'undefined' && window.location.port === '4321' ? 'http://localhost:3001/api' : '/api';
const ADMIN_STORAGE_KEY = 'novella_admin_session';
let allAuthors: any[] = [];
let authorSearchBound = false;

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem(ADMIN_STORAGE_KEY) || '';
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) { h['Authorization'] = `Bearer ${token}`; h['x-admin-token'] = token; }
  return h;
}

function renderAuthorsTable(query = ''): void {
  const tbody = document.getElementById('authors-tbody');
  const countEl = document.getElementById('authors-count');
  if (!tbody) return;
  const q = query.trim().toLowerCase();
  const list = q
    ? allAuthors.filter((a) =>
        a.name?.toLowerCase().includes(q) || a.email?.toLowerCase().includes(q) ||
        a.phone?.toLowerCase().includes(q) || a.address?.toLowerCase().includes(q))
    : allAuthors;

  if (countEl) countEl.textContent = `${list.length} penulis terdaftar`;
  if (list.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="px-4 py-8 text-center text-slate-500">Tidak ada data penulis sesuai pencarian.</td></tr>';
    return;
  }

  tbody.innerHTML = list.map((a: any) => {
    const rawPhone = String(a.phone || '');
    const waPhone = rawPhone.startsWith('0') ? '62' + rawPhone.slice(1) : rawPhone;
    const waMsg = encodeURIComponent(`Halo Kak ${a.name}, kami dari tim redaksi Novella.id. Ada yang bisa kami bantu seputar penerbitan naskah?`);
    const waUrl = `https://wa.me/${waPhone}?text=${waMsg}`;
    return `
      <tr class="hover:bg-slate-50/70 transition-colors align-middle">
        <td class="px-4 py-3 sm:pl-6 font-bold text-navy align-middle whitespace-nowrap">${a.name}</td>
        <td class="px-4 py-3 text-slate-600 align-middle whitespace-nowrap">${a.email}</td>
        <td class="px-4 py-3 font-mono text-slate-600 align-middle whitespace-nowrap">${a.phone || '–'}</td>
        <td class="px-4 py-3 text-slate-600 align-middle max-w-[240px]">
          <p class="truncate" title="${a.address || '-'}">${a.address || 'Belum diisi'}</p>
        </td>
        <td class="px-4 py-3 align-middle whitespace-nowrap">
          <span class="font-bold text-navy">${a.orderCount} naskah</span>
          <span class="font-mono text-[11px] font-bold text-emerald-700 ml-1">(${formatRp(a.totalSpend)})</span>
        </td>
        <td class="px-4 py-3 sm:pr-6 text-right align-middle whitespace-nowrap">
          <a href="${waUrl}" target="_blank" rel="noopener noreferrer" class="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors" title="Chat WhatsApp Penulis" aria-label="Chat WhatsApp Penulis"><svg class="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0012.04 2z"/></svg></a>
        </td>
      </tr>`;
  }).join('');
  syncTopScrollbar('authors-top-scroll', 'authors-table-wrap');
}

export async function fetchAdminAuthors(): Promise<void> {
  if (!authorSearchBound) {
    authorSearchBound = true;
    document.getElementById('authors-search-input')?.addEventListener('input', (e) => {
      renderAuthorsTable((e.target as HTMLInputElement).value);
    });
  }
  try {
    const res = await fetch(`${API_BASE}/admin/authors`, { headers: getAuthHeaders() });
    if (!res.ok) return;
    allAuthors = await res.json();
    renderAuthorsTable((document.getElementById('authors-search-input') as HTMLInputElement)?.value || '');
  } catch {}
}

export async function exportOrdersCsv(): Promise<void> {
  try {
    const res = await fetch(`${API_BASE}/admin/orders/export-csv`, { headers: getAuthHeaders() });
    if (!res.ok) return;
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `novella_orders_${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  } catch {}
}
