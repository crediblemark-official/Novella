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

    // Render saran harga genap (upsell cerdas jika harga ganjil)
    const suggestionBox = document.getElementById('suggestion-box');
    const suggestionItems = document.getElementById('suggestion-items');
    const mobileSuggestionBadge = document.getElementById('mobile-suggestion-badge');

    const suggestions = pricing.suggestions;
    const hasSuggestions = suggestions && suggestions.isOdd && (suggestions.copies || suggestions.addon);

    if (suggestionBox && suggestionItems) {
      if (hasSuggestions) {
        suggestionBox.classList.remove('hidden');
        if (mobileSuggestionBadge) mobileSuggestionBadge.classList.remove('hidden');

        let html = '';
        if (suggestions.copies) {
          const c = suggestions.copies;
          html += `
            <div class="rounded-xl border border-amber-200/90 bg-white/95 p-2.5 text-xs text-navy shadow-2xs hover:border-orange/60 transition-all">
              <div class="flex items-start justify-between gap-2.5">
                <div class="min-w-0">
                  <div class="flex items-center gap-1.5 flex-wrap">
                    <span class="font-extrabold text-xs text-navy">📚 Tambah jadi ${c.targetCopies} eks</span>
                    <span class="rounded bg-emerald-100 px-1.5 py-0.5 text-[9px] font-black text-emerald-800">Genap ${formatRp(c.newTotal)}</span>
                  </div>
                  <p class="text-[11px] text-slate-600 mt-1 leading-snug">
                    ${c.description}
                  </p>
                </div>
                <button
                  type="button"
                  data-action="apply-copies"
                  data-copies="${c.targetCopies}"
                  class="btn-apply-suggestion shrink-0 rounded-lg bg-orange px-3 py-1.5 text-xs font-bold text-white hover:bg-orange/90 active:scale-95 transition-all shadow-xs cursor-pointer"
                >
                  Pilih ${c.targetCopies} Eks
                </button>
              </div>
            </div>
          `;
        }

        if (suggestions.addon) {
          const a = suggestions.addon;
          html += `
            <div class="rounded-xl border border-amber-200/90 bg-white/95 p-2.5 text-xs text-navy shadow-2xs hover:border-navy/60 transition-all">
              <div class="flex items-start justify-between gap-2.5">
                <div class="min-w-0">
                  <div class="flex items-center gap-1.5 flex-wrap">
                    <span class="font-extrabold text-xs text-navy">✨ ${a.addonName}</span>
                    <span class="rounded bg-emerald-100 px-1.5 py-0.5 text-[9px] font-black text-emerald-800">Genap ${formatRp(a.newTotal)}</span>
                  </div>
                  <p class="text-[11px] text-slate-600 mt-1 leading-snug">
                    ${a.description}
                  </p>
                </div>
                <button
                  type="button"
                  data-action="apply-addon"
                  data-addon="${a.addonName}"
                  class="btn-apply-suggestion shrink-0 rounded-lg bg-navy px-3 py-1.5 text-xs font-bold text-white hover:bg-navy/90 active:scale-95 transition-all shadow-xs cursor-pointer"
                >
                  + Tambah
                </button>
              </div>
            </div>
          `;
        }

        suggestionItems.innerHTML = html;
      } else {
        suggestionBox.classList.add('hidden');
        if (mobileSuggestionBadge) mobileSuggestionBadge.classList.add('hidden');
        suggestionItems.innerHTML = '';
      }
    }

    saveDraftState();
  } catch (err) {
    console.error('Calculation error', err);
  }
}
