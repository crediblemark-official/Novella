import { formatRp } from './admin-table';

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

export async function fetchAdminAuthors(): Promise<void> {
  const tbody = document.getElementById('authors-tbody');
  if (!tbody) return;
  try {
    const res = await fetch(`${API_BASE}/admin/authors`, { headers: getAuthHeaders() });
    if (!res.ok) return;
    const authors = await res.json();
    if (authors.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="px-4 py-8 text-center text-slate-400">Belum ada data penulis terdaftar.</td></tr>';
      return;
    }

    tbody.innerHTML = authors
      .map((a: any) => {
        const rawPhone = String(a.phone || '');
        const waPhone = rawPhone.startsWith('0') ? '62' + rawPhone.slice(1) : rawPhone;
        const waMsg = encodeURIComponent(`Halo Kak ${a.name}, kami dari tim redaksi Novella.id. Ada yang bisa kami bantu seputar penerbitan naskah?`);
        const waUrl = `https://wa.me/${waPhone}?text=${waMsg}`;

        return `
          <tr class="hover:bg-slate-50 transition-colors">
            <td class="px-4 py-3 font-extrabold text-navy">${a.name}</td>
            <td class="px-4 py-3 text-slate-600">${a.email}</td>
            <td class="px-4 py-3 font-mono text-slate-600">${a.phone}</td>
            <td class="px-4 py-3 text-slate-500 max-w-[200px] truncate" title="${a.address}">${a.address}</td>
            <td class="px-4 py-3 font-bold text-navy whitespace-nowrap">${a.orderCount} naskah (${formatRp(a.totalSpend)})</td>
            <td class="px-4 py-3 text-right">
              <a href="${waUrl}" target="_blank" rel="noopener noreferrer" class="rounded-lg bg-emerald-600 px-2.5 py-1 text-[11px] font-extrabold text-white hover:bg-emerald-700 transition-colors">
                WA Penulis
              </a>
            </td>
          </tr>
        `;
      })
      .join('');
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
