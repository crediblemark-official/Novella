export function formatRp(num: number | string): string {
  return 'Rp ' + Number(num || 0).toLocaleString('id-ID');
}

export function renderOrderRow(o: any): string {
  let parsedAddons: string[] = [];
  try { parsedAddons = JSON.parse(o.addons || '[]'); } catch { parsedAddons = []; }

  const isWithdrawn = o.status === 'Ditarik Penulis';
  const isExpired = o.status === 'Kedaluwarsa';
  const isFinal = isWithdrawn || isExpired || o.isRevoked === 1;
  const isAwaiting = o.status === 'Menunggu Verifikasi' || o.status === 'Menunggu Konsultasi';

  const statusBg = isAwaiting
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
  const waMsg = encodeURIComponent(`Halo Kak ${o.authorName}, salam hangat dari Redaksi Novella.id terkait pesanan "${o.bookTitle}" (${o.orderCode}).`);
  const waUrl = `https://wa.me/${waPhone}?text=${waMsg}`;
  const apiBase = typeof window !== 'undefined' && window.location.port === '4321' ? 'http://localhost:3001/api' : '/api';

  const proofHtml = o.paymentProofUrl
    ? `<a href="${o.paymentProofUrl}" target="_blank" class="block mt-0.5 text-[10px] font-bold text-orange hover:underline">Bukti ↗</a>`
    : '';

  const trackingBtn = `<button type="button" onclick="window.promptTracking('${o.orderCode}', '${o.shippingCourier || 'J&T Express'}', '${o.shippingTrackingNumber || ''}')" class="inline-flex items-center rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-bold text-slate-700 hover:border-navy hover:text-navy transition-colors whitespace-nowrap cursor-pointer" title="Input atau ubah nomor resi">${o.shippingTrackingNumber ? `${o.shippingCourier || 'Resi'}: ${o.shippingTrackingNumber}` : '+ Input Resi'}</button>`;
  const addonLine = parsedAddons.length ? `<p class="text-[10px] font-semibold text-orange truncate" title="${parsedAddons.join(', ')}">+${parsedAddons.length} add-on</p>` : '';

  const statusCell = isFinal
    ? `<span class="inline-block rounded-lg border px-2 py-1 text-[11px] font-bold ${isWithdrawn ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-slate-300 bg-slate-100 text-slate-600'}">${isWithdrawn ? 'Ditarik' : 'Kedaluwarsa'}</span>`
    : `<select onchange="window.updateOrderStatus('${o.orderCode}', this.value)" class="rounded-lg border px-2 py-1 text-[11px] font-bold focus:outline-none ${statusBg}">
        <option value="Menunggu Konsultasi" ${o.status === 'Menunggu Konsultasi' ? 'selected' : ''}>Menunggu Konsultasi</option>
        <option value="Menunggu Verifikasi" ${o.status === 'Menunggu Verifikasi' ? 'selected' : ''}>Menunggu Verifikasi</option>
        <option value="Diproses" ${o.status === 'Diproses' ? 'selected' : ''}>Diproses</option>
        <option value="Selesai" ${o.status === 'Selesai' ? 'selected' : ''}>Selesai</option>
        <option value="Dibatalkan" ${o.status === 'Dibatalkan' ? 'selected' : ''}>Dibatalkan</option>
      </select>`;

  const fileAction = isFinal
    ? `<span class="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-rose-200 bg-rose-50 text-rose-600" title="Berkas naskah telah dihapus" aria-label="Berkas dihapus"><svg class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg></span>`
    : isAwaiting
    ? `<span class="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed" title="Naskah terkunci sebelum verifikasi" aria-label="Naskah terkunci"><svg class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg></span>`
    : `<a href="${apiBase}/files/${o.fileName}" target="_blank" class="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-navy hover:bg-slate-100 transition-colors" title="Unduh naskah (${o.fileOriginalName || 'Berkas'})" aria-label="Unduh naskah"><svg class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg></a>`;

  return `
    <tr class="hover:bg-slate-50/70 transition-colors align-middle">
      <td class="px-3 py-3 sm:pl-6 font-mono font-extrabold text-navy whitespace-nowrap align-middle">${o.orderCode}${proofHtml}</td>
      <td class="px-3 py-3 font-bold text-navy align-middle whitespace-nowrap">${o.authorName}</td>
      <td class="px-3 py-3 font-mono text-[11px] text-slate-600 align-middle whitespace-nowrap">${o.authorPhone}</td>
      <td class="px-3 py-3 text-slate-600 align-middle max-w-[150px]"><p class="truncate" title="${o.shippingAddress}">${o.shippingAddress}</p></td>
      <td class="px-3 py-3 font-bold text-navy align-middle max-w-[160px]"><p class="truncate" title="${o.bookTitle}">${o.bookTitle}</p></td>
      <td class="px-3 py-3 text-slate-600 align-middle whitespace-nowrap">${o.category}</td>
      <td class="px-3 py-3 text-[11px] text-slate-600 align-middle whitespace-nowrap"><p>${o.pages} hal · ${o.copies} eks · ${o.bookSize}</p>${addonLine}</td>
      <td class="px-3 py-3 align-middle whitespace-nowrap">${trackingBtn}</td>
      <td class="px-3 py-3 align-middle whitespace-nowrap">
        <p class="font-mono font-bold text-navy">${formatRp(o.totalPrice)}</p>
        <button type="button" onclick="window.promptPricing('${o.orderCode}', ${o.pages}, ${o.totalPrice})" class="text-[11px] font-bold text-orange hover:underline cursor-pointer">Ubah</button>
      </td>
      <td class="px-3 py-3 align-middle whitespace-nowrap">${statusCell}</td>
      <td class="px-3 py-3 sm:pr-6 align-middle text-right whitespace-nowrap">
        <div class="inline-flex items-center justify-end gap-1.5">
          ${fileAction}
          <a href="${waUrl}" target="_blank" rel="noopener noreferrer" class="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors" title="Chat WhatsApp Penulis" aria-label="Chat WhatsApp Penulis"><svg class="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0012.04 2z"/></svg></a>
        </div>
      </td>
    </tr>
  `;
}

export function syncTopScrollbar(topId: string, wrapId: string): void {
  const top = document.getElementById(topId);
  const wrap = document.getElementById(wrapId);
  const inner = top?.firstElementChild as HTMLElement | null;
  if (!top || !wrap || !inner) return;

  const refresh = () => {
    const sw = wrap.scrollWidth;
    const cw = wrap.clientWidth;
    top.classList.toggle('hidden', sw <= cw + 1);
    inner.style.width = `${sw}px`;
  };

  if (!wrap.dataset.scrollSynced) {
    wrap.dataset.scrollSynced = '1';
    let locking = false;
    top.addEventListener('scroll', () => {
      if (locking) return;
      locking = true; wrap.scrollLeft = top.scrollLeft; locking = false;
    });
    wrap.addEventListener('scroll', () => {
      if (locking) return;
      locking = true; top.scrollLeft = wrap.scrollLeft; locking = false;
    });
    if ('ResizeObserver' in window) {
      const ro = new ResizeObserver(refresh);
      ro.observe(wrap);
      if (wrap.firstElementChild) ro.observe(wrap.firstElementChild);
    }
    window.addEventListener('resize', refresh);
  }
  requestAnimationFrame(refresh);
}

export function renderOrdersTable(tbody: HTMLElement, orders: any[], filter: string, search: string): void {
  let filtered = filter !== 'ALL' ? orders.filter((o) => o.status === filter) : orders;
  if (search.trim()) {
    const q = search.toLowerCase();
    filtered = filtered.filter((o) =>
      o.orderCode?.toLowerCase().includes(q) || o.authorName?.toLowerCase().includes(q) || o.bookTitle?.toLowerCase().includes(q) || o.authorPhone?.toLowerCase().includes(q)
    );
  }
  tbody.innerHTML = filtered.length === 0
    ? '<tr><td colspan="11" class="px-4 py-8 text-center text-slate-500">Tidak ada pesanan sesuai filter.</td></tr>'
    : filtered.map(renderOrderRow).join('');
  syncTopScrollbar('orders-top-scroll', 'orders-table-wrap');
}
