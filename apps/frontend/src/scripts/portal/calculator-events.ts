import { calcState } from './state';
import { updateCalculator } from './calculator';
import { submitConsultationOrder } from './orders';

export function bindCalculatorEvents() {
  const inputPages = document.getElementById('input-pages') as HTMLInputElement | null;
  const inputCopies = document.getElementById('input-copies') as HTMLInputElement | null;

  inputPages?.addEventListener('input', () => {
    calcState.pages = Math.max(24, Math.min(600, Math.round(Number(inputPages.value) || 24)));
    syncChips('.page-chip', 'data-val', calcState.pages);
    updateCalculator();
  });
  inputPages?.addEventListener('blur', () => {
    inputPages.value = String(calcState.pages);
  });

  document.getElementById('btn-page-minus')?.addEventListener('click', () => {
    calcState.pages = Math.max(24, calcState.pages - 10);
    if (inputPages) inputPages.value = String(calcState.pages);
    syncChips('.page-chip', 'data-val', calcState.pages);
    updateCalculator();
  });
  document.getElementById('btn-page-plus')?.addEventListener('click', () => {
    calcState.pages = Math.min(600, calcState.pages + 10);
    if (inputPages) inputPages.value = String(calcState.pages);
    syncChips('.page-chip', 'data-val', calcState.pages);
    updateCalculator();
  });

  document.querySelectorAll<HTMLButtonElement>('.page-chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      const val = Number(chip.getAttribute('data-val'));
      calcState.pages = val;
      if (inputPages) inputPages.value = String(val);
      syncChips('.page-chip', 'data-val', val);
      updateCalculator();
    });
  });

  inputCopies?.addEventListener('input', () => {
    calcState.copies = Math.max(5, Math.min(1000, Math.round(Number(inputCopies.value) || 5)));
    syncChips('.copy-chip', 'data-val', calcState.copies);
    updateCalculator();
  });
  inputCopies?.addEventListener('blur', () => {
    inputCopies.value = String(calcState.copies);
  });

  document.getElementById('btn-copy-minus')?.addEventListener('click', () => {
    let next = calcState.copies;
    if (next > 50) next -= 10;
    else if (next === 50) next = 25;
    else if (next === 25) next = 10;
    else next = 5;
    calcState.copies = Math.max(5, next);
    if (inputCopies) inputCopies.value = String(calcState.copies);
    syncChips('.copy-chip', 'data-val', calcState.copies);
    updateCalculator();
  });

  document.getElementById('btn-copy-plus')?.addEventListener('click', () => {
    let next = calcState.copies;
    if (next < 10) next = 10;
    else if (next < 25) next = 25;
    else if (next < 50) next = 50;
    else next += 10;
    calcState.copies = Math.min(1000, next);
    if (inputCopies) inputCopies.value = String(calcState.copies);
    syncChips('.copy-chip', 'data-val', calcState.copies);
    updateCalculator();
  });

  document.querySelectorAll<HTMLButtonElement>('.copy-chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      const val = Number(chip.getAttribute('data-val'));
      calcState.copies = val;
      if (inputCopies) inputCopies.value = String(val);
      syncChips('.copy-chip', 'data-val', val);
      updateCalculator();
    });
  });

  document.querySelectorAll<HTMLButtonElement>('.size-card').forEach((card) => {
    card.addEventListener('click', () => {
      const size = card.getAttribute('data-size') || 'A5';
      calcState.bookSize = size;
      syncSelectionCard('.size-card', 'data-size', size, '.size-indicator');
      updateCalculator();
    });
  });

  document.querySelectorAll<HTMLButtonElement>('.print-chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      const print = (chip.getAttribute('data-print') || 'BW') as 'BW' | 'FC';
      calcState.printType = print;
      syncSelectionCard('.print-chip', 'data-print', print, '.print-indicator');
      updateCalculator();
    });
  });

  document.querySelectorAll<HTMLButtonElement>('.cover-chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      const cover = (chip.getAttribute('data-cover') || 'Soft Cover') as 'Soft Cover' | 'Hard Cover';
      calcState.coverType = cover;
      syncSelectionCard('.cover-chip', 'data-cover', cover, '.cover-indicator');
      updateCalculator();
    });
  });

  document.querySelectorAll<HTMLButtonElement>('.paper-chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      const paper = chip.getAttribute('data-paper') || 'bp57';
      calcState.paperType = paper;
      syncSelectionCard('.paper-chip', 'data-paper', paper, '.paper-indicator');
      updateCalculator();
    });
  });

  document.querySelectorAll<HTMLButtonElement>('.addon-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const addon = btn.getAttribute('data-addon') || '';
      const check = btn.querySelector('.addon-check');
      if (calcState.addons.includes(addon)) {
        calcState.addons = calcState.addons.filter((a) => a !== addon);
        btn.classList.remove('bg-orange/[0.06]');
        if (check) {
          check.textContent = '+';
          check.className = 'addon-check flex h-5 w-5 items-center justify-center rounded-full border border-slate-300 text-xs font-bold text-slate-500 bg-white transition-all';
        }
      } else {
        calcState.addons.push(addon);
        btn.classList.add('bg-orange/[0.06]');
        if (check) {
          check.textContent = '✓';
          check.className = 'addon-check flex h-5 w-5 items-center justify-center rounded-full bg-orange border border-orange text-white text-[10px] font-extrabold transition-all shadow-2xs';
        }
      }
      updateCalculator();
    });
  });

  // Event handler interaktif untuk Saran Harga Genap (Tambah Eks / Add-on)
  const suggestionItems = document.getElementById('suggestion-items');
  suggestionItems?.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('.btn-apply-suggestion');
    if (!btn) return;

    const action = btn.getAttribute('data-action');
    if (action === 'apply-copies') {
      const targetCopies = Number(btn.getAttribute('data-copies'));
      if (targetCopies) {
        calcState.copies = targetCopies;
        const inputCopies = document.getElementById('input-copies') as HTMLInputElement | null;
        if (inputCopies) inputCopies.value = String(targetCopies);
        syncChips('.copy-chip', 'data-val', targetCopies);
        updateCalculator();
      }
    } else if (action === 'apply-addon') {
      const targetAddon = btn.getAttribute('data-addon');
      if (targetAddon && !calcState.addons.includes(targetAddon)) {
        calcState.addons.push(targetAddon);
        document.querySelectorAll<HTMLButtonElement>('.addon-btn').forEach((addonBtn) => {
          if (addonBtn.getAttribute('data-addon') === targetAddon) {
            addonBtn.classList.add('bg-orange/[0.06]');
            const check = addonBtn.querySelector('.addon-check');
            if (check) {
              check.textContent = '✓';
              check.className = 'addon-check flex h-5 w-5 items-center justify-center rounded-full bg-orange border border-orange text-white text-[10px] font-extrabold transition-all shadow-2xs';
            }
          }
        });
        updateCalculator();
      }
    }
  });

  document.getElementById('mobile-suggestion-badge')?.addEventListener('click', () => {
    const box = document.getElementById('suggestion-box');
    if (box) {
      box.scrollIntoView({ behavior: 'smooth', block: 'center' });
      box.classList.add('ring-2', 'ring-orange');
      setTimeout(() => box.classList.remove('ring-2', 'ring-orange'), 1500);
    }
  });

  const mainSubmit = document.getElementById('btn-submit-consultation');
  const stickyBar = document.getElementById('mobile-sticky-bar');
  mainSubmit?.addEventListener('click', () => submitConsultationOrder());
  document.getElementById('btn-mobile-submit')?.addEventListener('click', () => submitConsultationOrder());
  if (mainSubmit && stickyBar && 'IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => {
      stickyBar.classList.toggle('translate-y-full', entry.isIntersecting);
      stickyBar.classList.toggle('opacity-0', entry.isIntersecting);
      stickyBar.classList.toggle('pointer-events-none', entry.isIntersecting);
    }, { threshold: 0.1 }).observe(mainSubmit);
  }
}

export function syncCalculatorUI() {
  const inputPages = document.getElementById('input-pages') as HTMLInputElement | null;
  const inputCopies = document.getElementById('input-copies') as HTMLInputElement | null;
  if (inputPages) inputPages.value = String(calcState.pages);
  if (inputCopies) inputCopies.value = String(calcState.copies);

  syncChips('.page-chip', 'data-val', calcState.pages);
  syncChips('.copy-chip', 'data-val', calcState.copies);
  syncSelectionCard('.size-card', 'data-size', calcState.bookSize, '.size-indicator');
  syncSelectionCard('.print-chip', 'data-print', calcState.printType, '.print-indicator');
  syncSelectionCard('.cover-chip', 'data-cover', calcState.coverType, '.cover-indicator');
  syncSelectionCard('.paper-chip', 'data-paper', calcState.paperType, '.paper-indicator');

  document.querySelectorAll<HTMLButtonElement>('.addon-btn').forEach((btn) => {
    const addon = btn.getAttribute('data-addon') || '';
    const active = calcState.addons.includes(addon);
    btn.classList.toggle('bg-orange/[0.06]', active);
    const check = btn.querySelector('.addon-check');
    if (check) {
      check.textContent = active ? '✓' : '+';
      check.className = active
        ? 'addon-check flex h-5 w-5 items-center justify-center rounded-full bg-orange border border-orange text-white text-[10px] font-extrabold transition-all shadow-2xs'
        : 'addon-check flex h-5 w-5 items-center justify-center rounded-full border border-slate-300 text-xs font-bold text-slate-500 bg-white transition-all';
    }
  });
}

function syncChips(selector: string, attr: string, activeVal: number) {
  document.querySelectorAll<HTMLButtonElement>(selector).forEach((c) => {
    const active = Number(c.getAttribute(attr)) === activeVal;
    c.classList.toggle('bg-navy', active);
    c.classList.toggle('text-white', active);
    c.classList.toggle('border-navy', active);
    c.classList.toggle('bg-white', !active);
    c.classList.toggle('text-slate-600', !active);
    c.classList.toggle('border-slate-200', !active);
  });
}

function syncSelectionCard(selector: string, attr: string, activeVal: string, indicatorSelector: string) {
  document.querySelectorAll<HTMLButtonElement>(selector).forEach((c) => {
    const active = c.getAttribute(attr) === activeVal;
    c.classList.toggle('border-2', active);
    c.classList.toggle('border-navy', active);
    c.classList.toggle('bg-navy/[0.03]', active);
    c.classList.toggle('shadow-xs', active);
    c.classList.toggle('border-slate-200/90', !active);
    c.classList.toggle('bg-white', !active);

    const ind = c.querySelector(indicatorSelector);
    if (ind) {
      ind.classList.toggle('opacity-100', active);
      ind.classList.toggle('scale-100', active);
      ind.classList.toggle('opacity-0', !active);
      ind.classList.toggle('scale-75', !active);
    }
  });
}
