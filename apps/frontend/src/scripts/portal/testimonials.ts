import { API_BASE, showToast } from './api';
import { portalState } from './state';

export function openAuthorTestimonialModal(): void {
  const dlg = document.getElementById('dlg-author-testimonial') as HTMLDialogElement | null;
  if (!dlg) return;

  try {
    const cached = portalState.currentUser || JSON.parse(localStorage.getItem('novella_auth_user') || '{}');
    const nameInput = document.getElementById('portal-testi-author') as HTMLInputElement | null;
    if (nameInput && !nameInput.value && cached?.name) {
      nameInput.value = cached.name;
    }
  } catch {}

  dlg.showModal();
}

export function bindTestimonialEvents(): void {
  const dlg = document.getElementById('dlg-author-testimonial') as HTMLDialogElement | null;
  const form = document.getElementById('portal-testimonial-form') as HTMLFormElement | null;
  const submitBtn = document.getElementById('portal-testi-submit') as HTMLButtonElement | null;

  document.getElementById('nav-testimonial-btn')?.addEventListener('click', () => {
    document.getElementById('nav-user-dropdown')?.classList.add('hidden');
    if (dlg) {
      openAuthorTestimonialModal();
    } else {
      window.location.href = '/portal?testimoni=1';
    }
  });

  const setPortalRating = (val: number) => {
    const score = Math.min(5, Math.max(1, val || 5));
    const input = document.getElementById('portal-testi-rating') as HTMLInputElement | null;
    if (input) input.value = String(score);
    document.querySelectorAll('#portal-testi-stars .portal-star-btn svg').forEach((svg, idx) => {
      svg.classList.toggle('text-amber-400', idx < score);
      svg.classList.toggle('text-slate-200', idx >= score);
    });
  };

  document.querySelectorAll('#portal-testi-stars .portal-star-btn').forEach((btn) => {
    btn.addEventListener('click', () => setPortalRating(Number(btn.getAttribute('data-star-val'))));
  });

  document.getElementById('dlg-testi-close')?.addEventListener('click', () => dlg?.close());
  document.getElementById('dlg-testi-cancel')?.addEventListener('click', () => dlg?.close());

  if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('testimoni') === '1') {
    setTimeout(() => openAuthorTestimonialModal(), 300);
  }

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Mengirim...';
    }

    try {
      const payload = {
        authorName: (document.getElementById('portal-testi-author') as HTMLInputElement).value.trim(),
        roleOrCity: (document.getElementById('portal-testi-role') as HTMLInputElement).value.trim(),
        rating: Number((document.getElementById('portal-testi-rating') as HTMLInputElement).value) || 5,
        quote: (document.getElementById('portal-testi-quote') as HTMLTextAreaElement).value.trim(),
      };

      const res = await fetch(`${API_BASE}/testimonials`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        form.reset();
        dlg?.close();
        showToast('Terima kasih! Testimoni dikirim untuk ditinjau redaksi.');
      } else {
        showToast(data?.error || 'Gagal mengirim testimoni.');
      }
    } catch {
      showToast('Gagal terhubung ke server.');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Kirim';
      }
    }
  });
}
