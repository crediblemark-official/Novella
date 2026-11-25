import { formatRp } from '../../utils/formatters';
import { calcState, bookState } from './state';

export function getStepFromUrl(): number {
  const path = window.location.pathname.replace(/\/$/, '');
  if (path.endsWith('/pembayaran') || path.endsWith('/konsultasi')) return 2;
  return 1;
}

export function getUrlFromStep(step: number): string {
  if (step === 2) return '/portal/pembayaran';
  return '/portal/kalkulator';
}

export function setStep(step: number, updateUrl = true) {
  const stepCalc = document.getElementById('step-calc');
  const stepPay = document.getElementById('step-pay');

  if (stepCalc) stepCalc.classList.toggle('hidden', step !== 1);
  if (stepPay) stepPay.classList.toggle('hidden', step !== 2);

  if (updateUrl) {
    const newUrl = getUrlFromStep(step);
    if (window.location.pathname !== newUrl) {
      window.history.pushState({ step }, '', newUrl);
    }
  }

  if (step === 2) {
    const payTitle = document.getElementById('pay-book-title');
    const payBadge = document.getElementById('pay-total-badge');
    const paySpecs = document.getElementById('pay-specs');

    if (payTitle) payTitle.textContent = bookState.title || '(Naskah Baru)';
    if (payBadge) payBadge.textContent = formatRp(calcState.total);
    if (paySpecs) paySpecs.textContent = `${calcState.pages} hal · ${calcState.copies} eks · ${calcState.bookSize}`;
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

export function bindRoutingEvents() {
  window.addEventListener('popstate', (e) => {
    const step = e.state?.step || getStepFromUrl();
    setStep(step, false);
  });

  document.getElementById('btn-back-to-calc')?.addEventListener('click', () => setStep(1, true));
}
