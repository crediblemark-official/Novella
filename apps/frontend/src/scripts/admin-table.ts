export function formatRp(num: number | string): string {
  return 'Rp ' + Number(num || 0).toLocaleString('id-ID');
}

export function renderOrderRow(o: any): string {
  let parsedAddons: string[] = [];
  try {
    parsedAddons = JSON.parse(o.addons || '[]');
  } catch {
    parsedAddons = [];
  }

  const isWithdrawn = o.status === 'Ditarik Penulis';
  const isExpired = o.status === 'Kedaluwarsa';
  const isFinal = isWithdrawn || isExpired || o.isRevoked === 1;
  const isAwaiting = o.status === 'Menunggu Verifikasi';

  const statusBg =
    o.status === 'Menunggu Verifikasi'
      ? 'bg-amber-50 text-amber-800 border-amber-200'
      : o.status === 'Diproses'
      ? 'bg-blue-50 text-blue-800 border-blue-200'
      : o.status === 'Selesai'
      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
      : isExpired
      ? 'bg-slate-100 text-slate-700 border-slate-300'
      : 'bg-rose-50 text-rose-800 border-rose-200';

  const rawPhone = String(o.authorPhone || '');
  const waPhone = rawPhone.startsWith('0') ? '62' + rawPhone.slice(1) : rawPhone;
  const waMsg = encodeURIComponent(
    `Halo Kak ${o.authorName}, kami dari tim redaksi Novella.id ingin menindaklanjuti pesanan naskah sastra "${o.bookTitle}" (Kode: ${o.orderCode}). Ada yang bisa kami bantu?`
  );
  const waUrl = `https://wa.me/${waPhone}?text=${waMsg}`;
  const apiBase = typeof window !== 'undefined' && window.location.port === '4321' ? 'http://localhost:3001/api' : '/api';

  return `
    <tr class="hover:bg-slate-50/60 transition-colors">
      <td class="px-4 py-3.5 font-mono font-extrabold text-navy whitespace-nowrap">
        ${o.orderCode}
      </td>
      <td class="px-4 py-3.5">
        <p class="font-extrabold text-navy">${o.authorName}</p>
        <p class="text-[11px] text-slate-500">${o.authorPhone}</p>
        <p class="text-[10px] text-slate-400 truncate max-w-[180px]" title="${o.shippingAddress}">${o.shippingAddress}</p>
      </td>
      <td class="px-4 py-3.5">
        <p class="font-extrabold text-navy">${o.bookTitle}</p>
        <p class="text-[11px] text-slate-500">${o.category}</p>
        <p class="font-mono text-[10px] text-slate-400">[${o.fileOriginalName || 'Naskah'}]</p>
      </td>
      <td class="px-4 py-3.5 text-[11px] text-slate-600">
        <p class="font-semibold">${o.pages} hal · ${o.copies} eks · ${o.bookSize}</p>
        <p class="text-slate-400">Add-on: ${parsedAddons.length ? parsedAddons.join(', ') : '–'}</p>
      </td>
      <td class="px-4 py-3.5 font-extrabold text-navy whitespace-nowrap">
        ${formatRp(o.totalPrice)}
      </td>
      <td class="px-4 py-3.5 whitespace-nowrap">
        ${
          isFinal
            ? isWithdrawn
              ? `<span class="inline-block rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-[11px] font-extrabold text-rose-700">Ditarik Penulis</span>`
              : `<span class="inline-block rounded-lg border border-slate-300 bg-slate-100 px-2.5 py-1 text-[11px] font-extrabold text-slate-600">Kedaluwarsa</span>`
            : `
            <select
              onchange="window.updateOrderStatus('${o.orderCode}', this.value)"
              class="rounded-lg border px-2.5 py-1 text-xs font-bold focus:outline-none ${statusBg}"
            >
              <option value="Menunggu Verifikasi" ${o.status === 'Menunggu Verifikasi' ? 'selected' : ''}>Menunggu Verifikasi</option>
              <option value="Diproses" ${o.status === 'Diproses' ? 'selected' : ''}>Diproses</option>
              <option value="Selesai" ${o.status === 'Selesai' ? 'selected' : ''}>Selesai</option>
            </select>
          `
        }
      </td>
      <td class="px-4 py-3.5 text-right whitespace-nowrap">
        <div class="flex items-center justify-end gap-1.5">
          ${
            isFinal
              ? `<span class="inline-flex items-center gap-1 text-[11px] text-rose-500 font-bold" title="Berkas naskah telah dihapus permanen dari server">
                  <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                  Berkas Dihapus
                </span>`
              : isAwaiting
              ? `<span class="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-bold text-slate-400 cursor-not-allowed" title="Naskah terkunci otomatis sebelum pembayaran diverifikasi oleh redaksi">
                  <svg class="h-3.5 w-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
                  Terkunci
                </span>`
              : `<a
                  href="${apiBase}/files/${o.fileName}"
                  target="_blank"
                  class="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-100 hover:text-navy transition-colors"
                >
                  Unduh
                </a>`
          }
          <a
            href="${waUrl}"
            target="_blank"
            rel="noopener noreferrer"
            class="rounded-lg bg-emerald-600 px-2.5 py-1 text-[11px] font-extrabold text-white hover:bg-emerald-700 transition-colors"
          >
            WA Penulis
          </a>
        </div>
      </td>
    </tr>
  `;
}

export function renderOrdersTable(
  tbody: HTMLElement,
  orders: any[],
  filter: string,
  search: string
): void {
  let filtered = orders;
  if (filter !== 'ALL') {
    filtered = filtered.filter((o) => o.status === filter);
  }
  if (search.trim()) {
    const q = search.toLowerCase();
    filtered = filtered.filter(
      (o) =>
        o.orderCode?.toLowerCase().includes(q) ||
        o.authorName?.toLowerCase().includes(q) ||
        o.bookTitle?.toLowerCase().includes(q) ||
        o.authorPhone?.toLowerCase().includes(q)
    );
  }

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="px-4 py-8 text-center text-slate-400">
          Tidak ada pesanan sastra yang sesuai filter.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = filtered.map(renderOrderRow).join('');
}
