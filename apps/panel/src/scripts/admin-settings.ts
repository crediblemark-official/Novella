const API_BASE = typeof window !== 'undefined' && (window.location.port === '4323' || window.location.port === '4321') ? 'http://localhost:3001/api' : (import.meta.env.PUBLIC_API_BASE || '/api');
const ADMIN_STORAGE_KEY = 'novella_admin_session';
const trashSvg = '<svg class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>';

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem(ADMIN_STORAGE_KEY) || '';
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) { h['Authorization'] = `Bearer ${token}`; h['x-admin-token'] = token; }
  return h;
}

export async function loadAdminSettings(): Promise<any> {
  try {
    const res = await fetch(`${API_BASE}/settings`);
    if (res.ok) {
      const data = await res.json();
      const waInput = document.getElementById('set-admin-wa') as HTMLInputElement | null;
      const addrInput = document.getElementById('set-company-address') as HTMLTextAreaElement | null;
      const tagInput = document.getElementById('set-company-tagline') as HTMLInputElement | null;
      if (waInput) waInput.value = data.adminWa || '';
      if (addrInput) addrInput.value = data.companyAddress || '';
      if (tagInput) tagInput.value = data.companyTagline || '';
      const qrisUrlInput = document.getElementById('set-qris-url') as HTMLInputElement | null;
      const qrisMerchantInput = document.getElementById('set-qris-merchant') as HTMLInputElement | null;
      if (qrisUrlInput) qrisUrlInput.value = data.qrisImageUrl || '';
      if (qrisMerchantInput) qrisMerchantInput.value = data.qrisMerchantName || '';
      renderQrisPreview(data.qrisImageUrl || '');
      renderBankList(data.bankAccounts || []);
      return data;
    }
  } catch {}
  return null;
}

function renderQrisPreview(url: string): void {
  const preview = document.getElementById('admin-qris-preview');
  const removeBtn = document.getElementById('btn-remove-qris');
  if (removeBtn) removeBtn.classList.toggle('hidden', !url);
  if (!preview) return;
  if (url) {
    preview.className = 'h-full w-full';
    preview.innerHTML = `<img src="${url.replace(/"/g, '&quot;')}" alt="QRIS Statis" class="h-full w-full object-contain bg-white p-1" />`;
  } else {
    preview.className = 'flex flex-col items-center justify-center gap-1 p-2 text-slate-400';
    preview.innerHTML = `
      <svg class="h-6 w-6" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
      </svg>
      <span class="text-[10px] font-bold">Unggah QRIS</span>
    `;
  }
}

export function renderBankList(banks: any[]): void {
  const container = document.getElementById('admin-bank-list');
  if (!container) return;
  if (banks.length === 0) {
    container.innerHTML = '<p class="text-xs text-slate-500 py-3">Belum ada rekening bank terdaftar.</p>';
    return;
  }

  container.innerHTML = banks.map((b, idx) => `
    <div class="py-3 flex items-center justify-between gap-3 text-xs">
      <div class="min-w-0">
        <p class="font-bold text-navy truncate">${b.bankName} <span class="font-normal text-slate-500">· a.n. ${b.accountHolder}</span></p>
        <p class="font-mono text-xs font-bold tracking-wider text-slate-700 mt-0.5">${b.accountNumber}</p>
      </div>
      <button type="button" onclick="window.removeBankRow(${idx})" class="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 cursor-pointer transition-colors" title="Hapus rekening" aria-label="Hapus rekening">${trashSvg}</button>
    </div>`).join('');
}

export async function saveAdminSettings(showToast: (msg: string) => void): Promise<void> {
  const wa = (document.getElementById('set-admin-wa') as HTMLInputElement)?.value.trim();
  const address = (document.getElementById('set-company-address') as HTMLTextAreaElement)?.value.trim();
  const tagline = (document.getElementById('set-company-tagline') as HTMLInputElement)?.value.trim();
  const qrisImageUrl = (document.getElementById('set-qris-url') as HTMLInputElement)?.value.trim() || null;
  const qrisMerchantName = (document.getElementById('set-qris-merchant') as HTMLInputElement)?.value.trim() || null;
  const banks = (window as any)._adminBanks || [];

  try {
    const res = await fetch(`${API_BASE}/admin/settings`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        adminWa: wa,
        companyAddress: address,
        companyTagline: tagline,
        bankAccounts: banks,
        qrisImageUrl,
        qrisMerchantName,
      }),
    });
    showToast(res.ok ? 'Pengaturan redaksi tersimpan.' : 'Gagal menyimpan pengaturan redaksi.');
  } catch {
    showToast('Tidak dapat menghubungi server.');
  }
}

export function bindAdminSettingsEvents(showToast: (m: string) => void): void {
  const qrisFileInput = document.getElementById('set-qris-file') as HTMLInputElement | null;
  const qrisDropBtn = document.getElementById('btn-upload-qris');

  qrisDropBtn?.addEventListener('click', () => qrisFileInput?.click());
  qrisFileInput?.addEventListener('change', async () => {
    const file = qrisFileInput.files?.[0];
    if (!file) return;
    try {
      const fd = new FormData();
      fd.append('file', file);
      const token = localStorage.getItem(ADMIN_STORAGE_KEY) || '';
      const headers: Record<string, string> = {};
      if (token) { headers['Authorization'] = `Bearer ${token}`; headers['x-admin-token'] = token; }

      const res = await fetch(`${API_BASE}/admin/settings/qris`, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: fd,
      });
      const data = await res.json();
      if (res.ok && data?.url) {
        (document.getElementById('set-qris-url') as HTMLInputElement).value = data.url;
        renderQrisPreview(data.url);
        showToast('QRIS diunggah. Klik Simpan untuk menerapkan.');
      } else {
        showToast(data?.error || 'Gagal mengunggah QRIS.');
      }
    } catch {
      showToast('Gagal mengunggah QRIS.');
    } finally {
      qrisFileInput.value = '';
    }
  });

  document.getElementById('btn-remove-qris')?.addEventListener('click', () => {
    (document.getElementById('set-qris-url') as HTMLInputElement).value = '';
    renderQrisPreview('');
    showToast('QRIS dihapus. Klik Simpan untuk menerapkan.');
  });
  document.getElementById('btn-add-bank-row')?.addEventListener('click', () => {
    const nameEl = document.getElementById('new-bank-name') as HTMLInputElement | null;
    const numEl = document.getElementById('new-bank-number') as HTMLInputElement | null;
    const holderEl = document.getElementById('new-bank-holder') as HTMLInputElement | null;
    const name = nameEl?.value.trim() || '';
    const num = numEl?.value.trim() || '';
    const holder = holderEl?.value.trim() || '';
    if (!name || !num || !holder) {
      showToast('Lengkapi nama bank, nomor rekening, dan atas nama.');
      return;
    }
    (window as any)._adminBanks.push({ bankName: name, accountNumber: num, accountHolder: holder });
    renderBankList((window as any)._adminBanks);
    if (nameEl) nameEl.value = '';
    if (numEl) numEl.value = '';
    if (holderEl) holderEl.value = '';
    showToast('Rekening ditambahkan. Klik Simpan untuk menerapkan.');
  });

  document.getElementById('admin-settings-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    saveAdminSettings(showToast);
  });
}
