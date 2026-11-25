import { formatRp } from '../../utils/formatters';
import { calcState, saveDraftState } from './state';
import { API_BASE } from './api';

export async function updateCalculator() {
  const summaryTotal = document.getElementById('summary-total');
  const summaryPerbook = document.getElementById('summary-perbook');
  const rowSummaryCopies = document.getElementById('row-summary-copies');
  const labelSummaryCopies = document.getElementById('label-summary-copies');
  const valSummaryCopies = document.getElementById('val-summary-copies');
  const rowSummaryPages = document.getElementById('row-summary-pages');
  const labelSummaryPages = document.getElementById('label-summary-pages');
  const valSummaryPages = document.getElementById('val-summary-pages');
  const labelSummarySize = document.getElementById('label-summary-size');
  const valSummarySize = document.getElementById('val-summary-size');
  const rowSummaryAddons = document.getElementById('row-summary-addons');
  const listSummaryAddons = document.getElementById('list-summary-addons');

  try {
    const res = await fetch(`${API_BASE}/orders/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pages: calcState.pages,
        copies: calcState.copies,
        bookSize: calcState.bookSize,
        addons: calcState.addons,
      }),
    });
    const pricing = await res.json();
    calcState.total = pricing.totalPrice;
    calcState.pricePerBook = pricing.pricePerBook;

    if (summaryTotal) summaryTotal.textContent = formatRp(pricing.totalPrice);
    if (summaryPerbook) summaryPerbook.textContent = `Sekitar ${formatRp(pricing.pricePerBook)} / buku`;

    if (rowSummaryCopies && labelSummaryCopies && valSummaryCopies) {
      const extra = pricing.extraCopies > 0;
      rowSummaryCopies.classList.toggle('hidden', !extra);
      rowSummaryCopies.classList.toggle('flex', extra);
      if (extra) {
        labelSummaryCopies.textContent = `Tambahan cetak (+${calcState.copies - 5} eks)`;
        valSummaryCopies.textContent = `+ ${formatRp(pricing.extraCopies)}`;
      }
    }

    if (rowSummaryPages && labelSummaryPages && valSummaryPages) {
      const extra = pricing.extraPages > 0;
      rowSummaryPages.classList.toggle('hidden', !extra);
      rowSummaryPages.classList.toggle('flex', extra);
      if (extra) {
        labelSummaryPages.textContent = `Tambahan halaman (+${calcState.pages - 100} hal)`;
        valSummaryPages.textContent = `+ ${formatRp(pricing.extraPages)}`;
      }
    }

    if (labelSummarySize && valSummarySize) {
      labelSummarySize.textContent = `Ukuran: ${calcState.bookSize}`;
      valSummarySize.textContent = pricing.sizeCost > 0 ? `+ ${formatRp(pricing.sizeCost)}` : 'Standar';
    }

    if (rowSummaryAddons && listSummaryAddons) {
      const hasAddons = pricing.details.addonItems.length > 0;
      rowSummaryAddons.classList.toggle('hidden', !hasAddons);
      if (hasAddons) {
        listSummaryAddons.innerHTML = pricing.details.addonItems
          .map((item: any) => `<div class="flex justify-between"><span>• ${item.name}</span><span class="font-bold">+ ${formatRp(item.price)}</span></div>`)
          .join('');
      }
    }

    saveDraftState();
  } catch (err) {
    console.error('Calculation error', err);
  }
}

export function bindCalculatorEvents() {
  const inputPages = document.getElementById('input-pages') as HTMLInputElement | null;
  const inputCopies = document.getElementById('input-copies') as HTMLInputElement | null;
  const pageChips = document.querySelectorAll<HTMLButtonElement>('.page-chip');
  const copyChips = document.querySelectorAll<HTMLButtonElement>('.copy-chip');
  const sizeCards = document.querySelectorAll<HTMLButtonElement>('.size-card');
  const addonBtns = document.querySelectorAll<HTMLButtonElement>('.addon-btn');

  inputPages?.addEventListener('input', () => {
    calcState.pages = Math.max(24, Math.min(600, Number(inputPages.value) || 24));
    updateCalculator();
  });

  document.getElementById('btn-page-minus')?.addEventListener('click', () => {
    calcState.pages = Math.max(24, calcState.pages - 10);
    if (inputPages) inputPages.value = String(calcState.pages);
    updateCalculator();
  });
  document.getElementById('btn-page-plus')?.addEventListener('click', () => {
    calcState.pages = Math.min(600, calcState.pages + 10);
    if (inputPages) inputPages.value = String(calcState.pages);
    updateCalculator();
  });

  pageChips.forEach((chip) => {
    chip.addEventListener('click', () => {
      const val = Number(chip.getAttribute('data-val'));
      calcState.pages = val;
      if (inputPages) inputPages.value = String(val);
      pageChips.forEach((c) => {
        const active = Number(c.getAttribute('data-val')) === val;
        c.classList.toggle('bg-navy', active);
        c.classList.toggle('text-white', active);
        c.classList.toggle('border-navy', active);
        c.classList.toggle('bg-white', !active);
        c.classList.toggle('text-slate-600', !active);
        c.classList.toggle('border-slate-200', !active);
      });
      updateCalculator();
    });
  });

  inputCopies?.addEventListener('input', () => {
    calcState.copies = Math.max(5, Math.min(1000, Number(inputCopies.value) || 5));
    updateCalculator();
  });

  document.getElementById('btn-copy-minus')?.addEventListener('click', () => {
    calcState.copies = Math.max(5, calcState.copies - 5);
    if (inputCopies) inputCopies.value = String(calcState.copies);
    updateCalculator();
  });
  document.getElementById('btn-copy-plus')?.addEventListener('click', () => {
    calcState.copies = Math.min(1000, calcState.copies + 5);
    if (inputCopies) inputCopies.value = String(calcState.copies);
    updateCalculator();
  });

  copyChips.forEach((chip) => {
    chip.addEventListener('click', () => {
      const val = Number(chip.getAttribute('data-val'));
      calcState.copies = val;
      if (inputCopies) inputCopies.value = String(val);
      copyChips.forEach((c) => {
        const active = Number(c.getAttribute('data-val')) === val;
        c.classList.toggle('bg-navy', active);
        c.classList.toggle('text-white', active);
        c.classList.toggle('border-navy', active);
        c.classList.toggle('bg-white', !active);
        c.classList.toggle('text-slate-600', !active);
        c.classList.toggle('border-slate-200', !active);
      });
      updateCalculator();
    });
  });

  sizeCards.forEach((card) => {
    card.addEventListener('click', () => {
      const size = card.getAttribute('data-size') || 'A5';
      calcState.bookSize = size;
      sizeCards.forEach((c) => {
        const active = c.getAttribute('data-size') === size;
        c.classList.toggle('border-2', active);
        c.classList.toggle('border-navy', active);
        c.classList.toggle('bg-slate-50/60', active);
        c.classList.toggle('border-slate-200', !active);
        c.classList.toggle('bg-white', !active);
        const dot = c.querySelector('.size-dot');
        const ind = c.querySelector('.size-indicator');
        dot?.classList.toggle('hidden', !active);
        if (ind) {
          ind.classList.toggle('border-2', active);
          ind.classList.toggle('border-navy', active);
          ind.classList.toggle('border-slate-300', !active);
        }
      });
      updateCalculator();
    });
  });

  addonBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const addon = btn.getAttribute('data-addon') || '';
      const check = btn.querySelector('.addon-check');
      if (calcState.addons.includes(addon)) {
        calcState.addons = calcState.addons.filter((a) => a !== addon);
        btn.classList.remove('border-orange', 'bg-orange/5', 'shadow-2xs');
        btn.classList.add('border-slate-200', 'bg-white');
        if (check) {
          check.textContent = '+';
          check.className = 'addon-check flex h-6 w-6 items-center justify-center rounded-full border border-slate-300 text-xs font-bold text-slate-400 bg-white transition-all';
        }
      } else {
        calcState.addons.push(addon);
        btn.classList.remove('border-slate-200', 'bg-white');
        btn.classList.add('border-orange', 'bg-orange/5', 'shadow-2xs');
        if (check) {
          check.textContent = '✓';
          check.className = 'addon-check flex h-6 w-6 items-center justify-center rounded-full bg-orange text-xs font-extrabold text-white transition-all';
        }
      }
      updateCalculator();
    });
  });
}
