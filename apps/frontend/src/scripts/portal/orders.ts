import { formatRp } from '../../utils/formatters';
import { calcState, bookState, portalState, STORAGE_KEY } from './state';
import { API_BASE, showToast } from './api';

export async function loadBankAccounts() {
  const container = document.getElementById('payment-bank-accounts');
  if (!container) return;
  try {
    const res = await fetch(`${API_BASE}/settings`);
    if (!res.ok) return;
    const data = await res.json();
    const banks = data.bankAccounts || [];
    if (banks.length === 0) {
      container.innerHTML = '<div class="py-3 text-center text-xs text-slate-400">Hubungi WhatsApp redaksi untuk rekening pembayaran.</div>';
      return;
    }

    container.innerHTML = banks
      .map((b: any) => `
        <div class="py-3 flex items-center justify-between">
          <div>
            <p class="text-xs font-extrabold text-navy">${b.bankName}</p>
            <p class="font-mono text-sm font-bold text-slate-800">${b.accountNumber}</p>
            <p class="text-[11px] text-slate-500">a.n. ${b.accountHolder}</p>
          </div>
          <button type="button" class="copy-btn rounded-lg border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-bold text-navy hover:bg-slate-50 transition-colors cursor-pointer" data-copy="${b.accountNumber.replace(/[^0-9]/g, '')}">
            Salin
          </button>
        </div>
      `).join('');

    container.querySelectorAll<HTMLButtonElement>('.copy-btn').forEach((btn) => {
      btn.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(btn.getAttribute('data-copy') || '');
          showToast('Nomor rekening berhasil disalin!');
        } catch {
          showToast('Gagal menyalin nomor rekening.');
        }
      });
    });
  } catch {}
}

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
        const statusClass = isPending ? 'bg-amber-100 text-amber-800' : o.status === 'Diproses' ? 'bg-blue-100 text-blue-800' : o.status === 'Selesai' ? 'bg-emerald-100 text-emerald-800' : isExpired ? 'bg-slate-200 text-slate-700' : 'bg-rose-100 text-rose-800';

        const actionHtml = isPending
          ? `<button onclick="window.withdrawAuthorOrder('${o.orderCode}')" class="rounded-lg border border-rose-300 bg-white px-3 py-1 font-bold text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer">Tarik Naskah</button>`
          : isWithdrawn
          ? `<span class="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600">Berkas Dihapus</span>`
          : isExpired
          ? `<span class="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500">Kedaluwarsa</span>`
          : `<span class="text-[11px] text-slate-400">Sedang diproses redaksi</span>`;

        const trackingHtml = o.shippingTrackingNumber
          ? `<div class="mt-1 inline-flex items-center gap-1 rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-extrabold text-emerald-800 border border-emerald-200">
              🚚 ${o.shippingCourier || 'Ekspedisi'}: ${o.shippingTrackingNumber}
             </div>`
          : '';

        return `
          <div class="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 text-xs shadow-xs">
            <div>
              <div class="flex items-center gap-2">
                <span class="font-mono font-extrabold text-navy">${o.orderCode}</span>
                <span class="rounded-full px-2 py-0.5 font-bold ${statusClass}">${o.status}</span>
              </div>
              <p class="mt-1 font-bold text-slate-800">${o.bookTitle} (${o.category})</p>
              <p class="text-[11px] text-slate-500 font-medium">${o.pages} hal · ${o.copies} eks · ${o.bookSize} · ${formatRp(o.totalPrice)}</p>
              ${trackingHtml}
            </div>
            <div>${actionHtml}</div>
          </div>
        `;
      })
      .join('');
  } catch (err) {
    console.error('Failed to load orders', err);
  }
}

export function bindOrderEvents() {
  loadBankAccounts();

  (window as any).withdrawAuthorOrder = async function (code: string) {
    if (!confirm(`Konfirmasi Tarik Naskah (${code}):\nApakah Anda yakin ingin membatalkan pesanan ini? Naskah digital akan langsung dihapus permanen dari server.`)) return;
    try {
      const res = await fetch(`${API_BASE}/orders/${code}/withdraw`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        showToast('Naskah berhasil ditarik & berkas fisik dihapus permanen.');
        loadAuthorOrders();
      } else {
        showToast(data.error || 'Gagal menarik naskah.');
      }
    } catch {
      showToast('Terjadi kesalahan saat membatalkan naskah.');
    }
  };

  // Payment Proof Upload
  const proofBtn = document.getElementById('btn-upload-proof');
  const proofInput = document.getElementById('input-payment-proof') as HTMLInputElement | null;
  const proofLabel = document.getElementById('proof-filename');
  const proofBadge = document.getElementById('proof-upload-badge');

  proofBtn?.addEventListener('click', () => proofInput?.click());
  proofInput?.addEventListener('change', async (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    if (proofLabel) proofLabel.textContent = file.name;

    const fd = new FormData();
    fd.append('file', file);
    try {
      const upRes = await fetch(`${API_BASE}/upload`, { method: 'POST', body: fd });
      const upData = await upRes.json();
      if (upRes.ok && upData.fileName && portalState.createdOrder) {
        await fetch(`${API_BASE}/orders/${portalState.createdOrder.orderCode}/payment-proof`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ proofUrl: `/api/files/${upData.fileName}` }),
        });
        proofBadge?.classList.remove('hidden');
        showToast('Bukti transfer berhasil diunggah!');
      }
    } catch {
      showToast('Gagal mengunggah bukti transfer.');
    }
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
