/** Helpers for native <dialog> / mobile bottom-sheet modals in Admin Workspace */

let trackingHandler: ((courier: string, tracking: string) => Promise<void>) | null = null;
let pricingHandler: ((pages: number, totalPrice: number) => Promise<void>) | null = null;

export function bindAdminDialogEvents() {
  document.querySelectorAll<HTMLButtonElement>('[data-close-dialog]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-close-dialog');
      if (id) (document.getElementById(id) as HTMLDialogElement | null)?.close();
    });
  });

  // Backdrop click closes dialog
  ['dlg-tracking', 'dlg-pricing', 'dlg-confirm'].forEach((id) => {
    const dlg = document.getElementById(id) as HTMLDialogElement | null;
    dlg?.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
  });

  document.getElementById('dlg-tracking-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const courier = (document.getElementById('dlg-tracking-courier') as HTMLInputElement)?.value.trim();
    const num = (document.getElementById('dlg-tracking-number') as HTMLInputElement)?.value.trim();
    if (!courier || !num || !trackingHandler) return;
    await trackingHandler(courier, num);
    (document.getElementById('dlg-tracking') as HTMLDialogElement | null)?.close();
  });

  document.getElementById('dlg-pricing-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const pages = Number((document.getElementById('dlg-pricing-pages') as HTMLInputElement)?.value);
    const price = Number((document.getElementById('dlg-pricing-price') as HTMLInputElement)?.value);
    if (!pages || price < 0 || !pricingHandler) return;
    await pricingHandler(pages, price);
    (document.getElementById('dlg-pricing') as HTMLDialogElement | null)?.close();
  });
}

export function openTrackingDialog(
  orderCode: string,
  curCourier: string,
  curResi: string,
  onSave: (courier: string, tracking: string) => Promise<void>
) {
  const dlg = document.getElementById('dlg-tracking') as HTMLDialogElement | null;
  const codeEl = document.getElementById('dlg-tracking-code');
  const courierEl = document.getElementById('dlg-tracking-courier') as HTMLInputElement | null;
  const numEl = document.getElementById('dlg-tracking-number') as HTMLInputElement | null;
  if (!dlg || !courierEl || !numEl) return;

  if (codeEl) codeEl.textContent = orderCode;
  courierEl.value = curCourier || 'J&T Express';
  numEl.value = curResi || '';
  trackingHandler = onSave;
  dlg.showModal();
  setTimeout(() => numEl.focus(), 50);
}

export function openPricingDialog(
  orderCode: string,
  curPages: number,
  curPrice: number,
  onSave: (pages: number, totalPrice: number) => Promise<void>
) {
  const dlg = document.getElementById('dlg-pricing') as HTMLDialogElement | null;
  const codeEl = document.getElementById('dlg-pricing-code');
  const pagesEl = document.getElementById('dlg-pricing-pages') as HTMLInputElement | null;
  const priceEl = document.getElementById('dlg-pricing-price') as HTMLInputElement | null;
  if (!dlg || !pagesEl || !priceEl) return;

  if (codeEl) codeEl.textContent = orderCode;
  pagesEl.value = String(curPages || 100);
  priceEl.value = String(curPrice || 150000);
  pricingHandler = onSave;
  dlg.showModal();
  setTimeout(() => priceEl.focus(), 50);
}

export function openConfirmDialog(title: string, message: string, okLabel = 'Ya', danger = false): Promise<boolean> {
  return new Promise((resolve) => {
    const dlg = document.getElementById('dlg-confirm') as HTMLDialogElement | null;
    const titleEl = document.getElementById('dlg-confirm-title');
    const msgEl = document.getElementById('dlg-confirm-msg');
    const okBtn = document.getElementById('dlg-confirm-ok');
    const cancelBtn = document.getElementById('dlg-confirm-cancel');
    if (!dlg || !okBtn || !cancelBtn) { resolve(false); return; }

    if (titleEl) titleEl.textContent = title;
    if (msgEl) msgEl.textContent = message;
    okBtn.textContent = okLabel;
    okBtn.className = danger
      ? 'min-h-[40px] rounded-xl bg-rose-600 px-5 py-2 text-xs font-extrabold text-white hover:bg-rose-700 active:scale-[0.98] transition-all cursor-pointer'
      : 'min-h-[40px] rounded-xl bg-navy px-5 py-2 text-xs font-extrabold text-white hover:bg-slate-800 active:scale-[0.98] transition-all cursor-pointer';

    const cleanup = (val: boolean) => {
      okBtn.removeEventListener('click', onOk);
      cancelBtn.removeEventListener('click', onCancel);
      dlg.removeEventListener('cancel', onCancel);
      dlg.close();
      resolve(val);
    };
    const onOk = () => cleanup(true);
    const onCancel = () => cleanup(false);

    okBtn.addEventListener('click', onOk);
    cancelBtn.addEventListener('click', onCancel);
    dlg.addEventListener('cancel', onCancel);
    dlg.showModal();
  });
}
