import { formatRp } from '../../utils/formatters';
import { calcState, bookState, portalState, STORAGE_KEY } from './state';
import { API_BASE, showToast } from './api';

export async function loadAuthorOrders() {
  const historyList = document.getElementById('history-list');
  const userOrdersCount = document.getElementById('user-orders-count');
  if (!portalState.currentUser?.email || !historyList) return;

  try {
    const res = await fetch(`${API_BASE}/orders?email=${encodeURIComponent(portalState.currentUser.email)}`);
    const orders = await res.json();
    if (userOrdersCount) userOrdersCount.textContent = String(orders.length);

    if (orders.length === 0) {
      historyList.innerHTML = '<p class="text-xs text-slate-400">Belum ada pesanan yang dibuat.</p>';
      return;
    }

    historyList.innerHTML = orders
      .map((o: any) => {
        const isPending = o.status === 'Menunggu Verifikasi';
        const isWithdrawn = o.status === 'Ditarik Penulis';
        const isExpired = o.status === 'Kedaluwarsa';
        const statusClass =
          isPending
            ? 'bg-amber-100 text-amber-800'
            : o.status === 'Diproses'
            ? 'bg-blue-100 text-blue-800'
            : o.status === 'Selesai'
            ? 'bg-emerald-100 text-emerald-800'
            : isExpired
            ? 'bg-slate-200 text-slate-700'
            : 'bg-rose-100 text-rose-800';

        const actionHtml = isPending
          ? `<button onclick="window.withdrawAuthorOrder('${o.orderCode}')" class="rounded-lg border border-rose-300 bg-white px-3 py-1 font-bold text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer">Tarik Naskah</button>`
          : isWithdrawn
          ? `<span class="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600">
              <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
              Berkas Dihapus
            </span>`
          : isExpired
          ? `<span class="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500">
              <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              Kedaluwarsa
            </span>`
          : `<span class="text-[11px] text-slate-400">Sedang diproses redaksi</span>`;

        return `
          <div class="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 text-xs shadow-xs">
            <div>
              <div class="flex items-center gap-2">
                <span class="font-mono font-extrabold text-navy">${o.orderCode}</span>
                <span class="rounded-full px-2 py-0.5 font-bold ${statusClass}">${o.status}</span>
              </div>
              <p class="mt-1 font-bold text-slate-800">${o.bookTitle} (${o.category})</p>
              <p class="text-[11px] text-slate-500 font-medium">${o.pages} hal · ${o.copies} eks · ${o.bookSize} · ${formatRp(o.totalPrice)}</p>
            </div>
            <div>
              ${actionHtml}
            </div>
          </div>
        `;
      })
      .join('');
  } catch (err) {
    console.error('Failed to load orders', err);
  }
}

export function bindOrderEvents() {
  const toggleHistoryBtn = document.getElementById('toggle-history-btn');
  const historyBox = document.getElementById('history-box');
  const closeHistoryBtn = document.getElementById('close-history-btn');

  if (toggleHistoryBtn && historyBox) {
    toggleHistoryBtn.addEventListener('click', () => historyBox.classList.toggle('hidden'));
  }
  if (closeHistoryBtn && historyBox) {
    closeHistoryBtn.addEventListener('click', () => historyBox.classList.add('hidden'));
  }

  // Exposed globally for onclick in dynamically injected HTML
  (window as any).withdrawAuthorOrder = async function (code: string) {
    if (!confirm(`Konfirmasi Tarik Naskah (${code}):\nApakah Anda yakin ingin membatalkan pesanan ini? Naskah digital akan langsung dihapus permanen dari server detik ini juga dan transaksi dibatalkan.`)) {
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/orders/${code}/withdraw`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        const dateObj = data.deletedAt ? new Date(data.deletedAt) : new Date();
        const timeFormatted = dateObj.toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        }) + ' pukul ' + dateObj.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';

        alert(`Bukti Penghapusan Berkas:\nBerkas "${data.fileName || 'Naskah'}" telah dihapus permanen dari server pada ${timeFormatted}.\n\nStatus pesanan Anda kini "Ditarik Penulis".`);
        showToast('Naskah berhasil ditarik & berkas fisik dihapus permanen.');
        loadAuthorOrders();
      } else {
        showToast(data.error || 'Gagal menarik naskah.');
      }
    } catch {
      showToast('Terjadi kesalahan saat membatalkan naskah.');
    }
  };

  // Copy Rekening Buttons
  document.querySelectorAll<HTMLButtonElement>('.copy-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const text = btn.getAttribute('data-copy') || '';
      try {
        await navigator.clipboard.writeText(text);
        showToast('Nomor rekening berhasil disalin!');
      } catch {
        showToast('Gagal menyalin nomor rekening.');
      }
    });
  });

  // Confirm Order & WhatsApp Redirect
  document.getElementById('btn-confirm-order')?.addEventListener('click', async () => {
    if (!portalState.currentUser) {
      showToast('Sesi masuk berakhir. Silakan login kembali.');
      window.location.replace('/login');
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          authorName: portalState.currentUser.name,
          authorEmail: portalState.currentUser.email,
          authorPhone: portalState.currentUser.phone || '08123456789',
          shippingAddress: portalState.currentUser.address || 'Alamat Penulis',
          bookTitle: bookState.title,
          category: bookState.category,
          pages: calcState.pages,
          copies: calcState.copies,
          bookSize: calcState.bookSize,
          addons: calcState.addons,
          fileName: bookState.uploadedFileName,
          fileOriginalName: bookState.uploadedFileOriginalName,
          fileSize: bookState.uploadedFileSize,
          fileMimeType: bookState.uploadedFileMimeType,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        portalState.createdOrder = data.order;
        showToast(`Pesanan ${data.order.orderCode} berhasil disimpan! Membuka WhatsApp...`);

        const withdrawBtn = document.getElementById('btn-withdraw-current');
        if (withdrawBtn) {
          withdrawBtn.classList.remove('hidden');
          withdrawBtn.onclick = () => (window as any).withdrawAuthorOrder(data.order.orderCode);
        }

        sessionStorage.removeItem(STORAGE_KEY);
        window.open(data.waUrl, '_blank');
        loadAuthorOrders();
      } else {
        showToast(data.error || 'Gagal membuat pesanan.');
      }
    } catch {
      showToast('Terjadi kesalahan saat menyimpan pesanan.');
    }
  });
}
