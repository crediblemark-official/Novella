import { formatRp } from '../../utils/formatters';
import { calcState, saveDraftState } from './state';
import { API_BASE } from './api';
export { bindCalculatorEvents } from './calculator-events';

export async function updateCalculator() {
  const summaryTotal = document.getElementById('summary-total');
  const summaryOriginal = document.getElementById('summary-original');
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
        printType: calcState.printType,
        paperType: calcState.paperType,
        coverType: calcState.coverType,
        addons: calcState.addons,
      }),
    });
    const pricing = await res.json();
    calcState.total = pricing.totalPrice;
    calcState.originalTotal = pricing.originalPrice;
    calcState.pricePerBook = pricing.pricePerBook;

    if (summaryTotal) summaryTotal.textContent = formatRp(pricing.totalPrice);
    if (summaryOriginal) summaryOriginal.textContent = formatRp(pricing.originalPrice);
    if (summaryPerbook) summaryPerbook.textContent = `Sekitar ${formatRp(pricing.pricePerBook)} / buku (${calcState.copies} eksemplar)`;

    const mobTotal = document.getElementById('mobile-summary-total');
    const mobOriginal = document.getElementById('mobile-summary-original');
    if (mobTotal) mobTotal.textContent = formatRp(pricing.totalPrice);
    if (mobOriginal) mobOriginal.textContent = formatRp(pricing.originalPrice);

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
      labelSummarySize.textContent = `${calcState.bookSize} · ${pricing.details?.printType || 'BW'} · ${pricing.details?.paperType} · ${calcState.coverType}`;
      const isBaseSize = (calcState.bookSize === 'A5' || calcState.bookSize === 'Unesco');
      const isBasePaper = (calcState.paperType === 'bp57' || calcState.paperType === 'hvs70');
      const isBase = isBaseSize && isBasePaper && calcState.coverType === 'Soft Cover' && calcState.printType === 'BW';
      valSummarySize.textContent = isBase ? 'Paket Dasar' : 'Kustom';
      valSummarySize.className = isBase
        ? 'shrink-0 whitespace-nowrap rounded bg-orange/15 px-2 py-0.5 text-[10px] font-bold text-orange'
        : 'shrink-0 whitespace-nowrap rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600';
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
