import { formatRp } from '../../utils/formatters';
import { calcState, bookState, portalState, STORAGE_KEY } from './state';
import { API_BASE, showToast } from './api';
import { setStep } from './router';

export async function submitConsultationOrder() {
  if (!portalState.currentUser) {
    showToast('Sesi masuk berakhir. Silakan login kembali.');
    window.location.replace('/login');
    return;
  }

  const titleInput = document.getElementById('input-book-title') as HTMLInputElement | null;
  const categorySelect = document.getElementById('select-book-category') as HTMLSelectElement | null;
  const title = titleInput?.value.trim() || bookState.title;
  const category = categorySelect?.value || bookState.category || 'Novel Sastra';

  if (!title) {
    showToast('Silakan masukkan judul karya/naskah Anda.');
    titleInput?.focus();
    return;
  }

  bookState.title = title;
  bookState.category = category;

  const btn = document.getElementById('btn-submit-consultation') as HTMLButtonElement | null;
  if (btn) { btn.disabled = true; btn.textContent = 'Mencatat Pesanan ke Redaksi...'; }

  try {
    const res = await fetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        authorName: portalState.currentUser.name || 'Penulis Novella',
        authorEmail: portalState.currentUser.email,
        authorPhone: portalState.currentUser.phone || '08123456789',
        shippingAddress: portalState.currentUser.address || 'Alamat Penulis',
        bookTitle: title,
        category,
        pages: calcState.pages,
        copies: calcState.copies,
        bookSize: calcState.bookSize,
        printType: calcState.printType,
        paperType: calcState.paperType,
        coverType: calcState.coverType,
        addons: calcState.addons,
        status: 'Menunggu Konsultasi',
      }),
    });

    const data = await res.json();
    if (res.ok && data.success) {
      portalState.createdOrder = data.order;
      showToast(`Pesanan ${data.order.orderCode} berhasil dicatat!`);

      const elCode = document.getElementById('pay-order-code');
      const elTitle = document.getElementById('pay-book-title');
      const elSpecs = document.getElementById('pay-specs');
      const elTotal = document.getElementById('pay-total-badge');
      const elWaBtn = document.getElementById('btn-open-wa-consultation') as HTMLAnchorElement | null;

      const paperLabel = calcState.paperType === 'hvs70' ? 'HVS 70' : calcState.paperType === 'bp72' ? 'BP 72' : calcState.paperType === 'hvs80' ? 'HVS 80' : 'BP 57';
      if (elCode) elCode.textContent = data.order.orderCode;
      if (elTitle) elTitle.textContent = data.order.bookTitle;
      if (elSpecs) elSpecs.textContent = `${data.order.pages} hal · ${data.order.copies} eks · ${data.order.bookSize} (${paperLabel})`;
      if (elTotal) elTotal.textContent = formatRp(data.order.totalPrice);
      if (elWaBtn) elWaBtn.href = data.waUrl;

      sessionStorage.removeItem(STORAGE_KEY);
      setStep(2, true);
      loadAuthorOrders();
    } else {
      showToast(data.error || 'Gagal mengajukan pesanan.');
    }
  } catch {
    showToast('Terjadi kesalahan saat menghubungi server.');
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = 'Konsultasi Naskah ke Admin →'; }
  }
}

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
    container.innerHTML = banks.map((b: any) => `
      <div class="py-3 flex items-center justify-between gap-3">
        <div class="min-w-0">
          <p class="text-xs font-extrabold text-navy truncate">${b.bankName}</p>
          <p class="font-mono text-xs font-bold tracking-wider text-slate-800 mt-0.5">${b.accountNumber}</p>
          <p class="text-[10px] text-slate-500 truncate">a.n. ${b.accountHolder}</p>
        </div>
        <button type="button" class="copy-btn shrink-0 min-h-[36px] rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-bold text-navy hover:border-navy hover:bg-slate-50 active:scale-95 transition-all cursor-pointer" data-copy="${b.accountNumber.replace(/[^0-9]/g, '')}">Salin</button>
      </div>`).join('');
    container.querySelectorAll<HTMLButtonElement>('.copy-btn').forEach((b) => b.addEventListener('click', () => {
      navigator.clipboard.writeText(b.getAttribute('data-copy') || '');
      showToast('Nomor rekening disalin!');
    }));
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

    historyList.innerHTML = orders.map((o: any) => {
      const isConsulting = o.status === 'Menunggu Konsultasi' || o.status === 'Menunggu Verifikasi';
      const statusBadge = isConsulting ? 'bg-amber-100 text-amber-800' : o.status === 'Diproses' ? 'bg-blue-100 text-blue-800' : o.status === 'Selesai' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800';
      const waFollowupText = encodeURIComponent(`Halo Redaksi Novella.id, saya ingin menanyakan progres naskah saya "${o.bookTitle}" (Kode: ${o.orderCode}). Terima kasih!`);
      const waFollowupUrl = `https://wa.me/6281995100401?text=${waFollowupText}`;

      const trackingHtml = o.shippingTrackingNumber ? `<div class="mt-1 text-[10px] font-bold text-emerald-700">Resi ${o.shippingCourier || 'Ekspedisi'}: <span class="font-mono">${o.shippingTrackingNumber}</span></div>` : '';

      return `
        <div class="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 text-xs shadow-xs">
          <div>
            <div class="flex items-center gap-2">
              <span class="font-mono font-extrabold text-navy">${o.orderCode}</span>
              <span class="rounded-full px-2 py-0.5 font-bold ${statusBadge}">${o.status}</span>
            </div>
            <p class="mt-1 font-bold text-slate-800">${o.bookTitle}</p>
            <p class="text-[11px] text-slate-500">${o.pages} hal · ${o.copies} eks · ${o.bookSize} · ${formatRp(o.totalPrice)}</p>
            ${trackingHtml}
          </div>
          <div class="flex items-center gap-2">
            <a href="${waFollowupUrl}" target="_blank" class="rounded-lg bg-emerald-50 border border-emerald-300 px-2.5 py-1 text-[11px] font-bold text-emerald-800 hover:bg-emerald-100 transition-colors">Chat Redaksi WA</a>
            ${isConsulting ? `<button onclick="window.withdrawAuthorOrder('${o.orderCode}')" class="text-[11px] font-bold text-rose-600 hover:underline cursor-pointer">Batal</button>` : ''}
          </div>
        </div>`;
    }).join('');
  } catch {}
}

function confirmPortalCancel(code: string): Promise<boolean> {
  return new Promise((resolve) => {
    const dlg = document.getElementById('dlg-portal-confirm') as HTMLDialogElement | null;
    const msg = document.getElementById('dlg-portal-msg');
    const ok = document.getElementById('dlg-portal-ok');
    const cancel = document.getElementById('dlg-portal-cancel');
    if (!dlg || !ok || !cancel) { resolve(false); return; }
    if (msg) msg.textContent = `Batalkan pengajuan pesanan ${code}?`;
    const done = (v: boolean) => { ok.removeEventListener('click', onOk); cancel.removeEventListener('click', onCancel); dlg.close(); resolve(v); };
    const onOk = () => done(true);
    const onCancel = () => done(false);
    ok.addEventListener('click', onOk);
    cancel.addEventListener('click', onCancel);
    dlg.showModal();
  });
}

export function bindOrderEvents() {
  loadBankAccounts();

  (window as any).withdrawAuthorOrder = async function (code: string) {
    if (!(await confirmPortalCancel(code))) return;
    try {
      const res = await fetch(`${API_BASE}/orders/${code}/withdraw`, { method: 'POST' });
      if (res.ok) { showToast('Pesanan dibatalkan.'); loadAuthorOrders(); }
    } catch { showToast('Gagal membatalkan pesanan.'); }
  };

  document.getElementById('btn-view-author-history')?.addEventListener('click', () => {
    const box = document.getElementById('history-box');
    if (box) { box.classList.remove('hidden'); box.scrollIntoView({ behavior: 'smooth' }); }
  });
}
