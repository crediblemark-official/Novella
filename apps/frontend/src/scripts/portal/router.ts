import { formatRp } from '../../utils/formatters';
import { calcState, bookState } from './state';

export function getStepFromUrl(): number {
  const path = window.location.pathname.replace(/\/$/, '');
  if (path.endsWith('/pembayaran')) return 3;
  if (path.endsWith('/naskah')) return 2;
  return 1;
}

export function getUrlFromStep(step: number): string {
  if (step === 3) return '/portal/pembayaran';
  if (step === 2) return '/portal/naskah';
  return '/portal/kalkulator';
}

export function setStep(step: number, updateUrl = true) {
  const stepCalc = document.getElementById('step-calc');
  const stepBook = document.getElementById('step-book');
  const stepPay = document.getElementById('step-pay');
  const stepPills = document.querySelectorAll<HTMLAnchorElement>('.step-pill');

  if (stepCalc) stepCalc.classList.toggle('hidden', step !== 1);
  if (stepBook) stepBook.classList.toggle('hidden', step !== 2);
  if (stepPay) stepPay.classList.toggle('hidden', step !== 3);

  if (updateUrl) {
    const newUrl = getUrlFromStep(step);
    if (window.location.pathname !== newUrl) {
      window.history.pushState({ step }, '', newUrl);
    }
  }

  stepPills.forEach((pill) => {
    const s = Number(pill.getAttribute('data-step'));
    const active = s === step;
    const past = s < step;
    pill.classList.toggle('text-navy', active);
    pill.classList.toggle('font-extrabold', active);
    pill.classList.toggle('text-slate-400', !active && !past);
    pill.classList.toggle('text-emerald-700', past);

    const circle = pill.querySelector('span:first-child');
    if (circle) {
      circle.classList.toggle('bg-navy', active);
      circle.classList.toggle('text-white', active);
      circle.classList.toggle('bg-emerald-100', past);
      circle.classList.toggle('text-emerald-700', past);
      circle.classList.toggle('bg-slate-200', !active && !past);
      circle.classList.toggle('text-slate-600', !active && !past);
    }
  });

  if (step === 2) {
    const bookTotal = document.getElementById('book-summary-total');
    const bookSpecs = document.getElementById('book-summary-specs');
    const bookAddons = document.getElementById('book-summary-addons');
    if (bookTotal) bookTotal.textContent = formatRp(calcState.total);
    if (bookSpecs) bookSpecs.textContent = `${calcState.pages} hal · ${calcState.copies} eks · ${calcState.bookSize}`;
    if (bookAddons) bookAddons.textContent = calcState.addons.length > 0 ? calcState.addons.join(', ') : 'Standar';
  }

  if (step === 3) {
    const payTitle = document.getElementById('pay-book-title');
    const payBadge = document.getElementById('pay-total-badge');
    const paySpecs = document.getElementById('pay-specs');
    const payAddons = document.getElementById('pay-addons');

    if (payTitle) payTitle.textContent = `Buku: ${bookState.title || '(Tanpa Judul)'}`;
    if (payBadge) payBadge.textContent = formatRp(calcState.total);
    if (paySpecs) paySpecs.textContent = `${calcState.pages} hal · ${calcState.copies} eks · ${calcState.bookSize}`;
    if (payAddons) payAddons.textContent = `Add-on: ${calcState.addons.length > 0 ? calcState.addons.join(', ') : 'Tidak ada'}`;
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

export function bindRoutingEvents() {
  window.addEventListener('popstate', (e) => {
    const step = e.state?.step || getStepFromUrl();
    setStep(step, false);
  });

  document.querySelectorAll<HTMLAnchorElement>('.step-pill').forEach((pill) => {
    pill.addEventListener('click', (e) => {
      e.preventDefault();
      const s = Number(pill.getAttribute('data-step'));
      setStep(s, true);
    });
  });

  document.getElementById('btn-goto-step-book')?.addEventListener('click', () => setStep(2, true));
  document.getElementById('btn-back-to-calc')?.addEventListener('click', () => setStep(1, true));
  document.getElementById('btn-back-to-book')?.addEventListener('click', () => setStep(2, true));
}
