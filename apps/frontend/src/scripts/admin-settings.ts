const API_BASE = typeof window !== 'undefined' && window.location.port === '4321' ? 'http://localhost:3001/api' : '/api';
const ADMIN_STORAGE_KEY = 'novella_admin_session';

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem(ADMIN_STORAGE_KEY) || '';
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) {
    h['Authorization'] = `Bearer ${token}`;
    h['x-admin-token'] = token;
  }
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

      renderBankList(data.bankAccounts || []);
      return data;
    }
  } catch {}
  return null;
}

export function renderBankList(banks: any[]): void {
  const container = document.getElementById('admin-bank-list');
  if (!container) return;
  if (banks.length === 0) {
    container.innerHTML = '<p class="text-xs text-slate-400 py-2">Belum ada rekening bank yang ditambahkan.</p>';
    return;
  }

  container.innerHTML = banks
    .map(
      (b, idx) => `
      <div class="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs">
        <div>
          <p class="font-extrabold text-navy">${b.bankName}</p>
          <p class="font-mono text-slate-700">${b.accountNumber} <span class="text-slate-400 font-normal">a.n. ${b.accountHolder}</span></p>
        </div>
        <button type="button" onclick="window.removeBankRow(${idx})" class="text-rose-600 hover:text-rose-800 font-bold px-2 py-1 cursor-pointer">Hapus</button>
      </div>
    `
    )
    .join('');
}

export async function saveAdminSettings(showToast: (msg: string) => void): Promise<void> {
  const wa = (document.getElementById('set-admin-wa') as HTMLInputElement)?.value.trim();
  const address = (document.getElementById('set-company-address') as HTMLTextAreaElement)?.value.trim();
  const tagline = (document.getElementById('set-company-tagline') as HTMLInputElement)?.value.trim();

  // Collect banks from global state or DOM
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
      }),
    });
    if (res.ok) {
      showToast('Pengaturan redaksi berhasil disimpan!');
    } else {
      showToast('Gagal menyimpan pengaturan redaksi.');
    }
  } catch {
    showToast('Tidak dapat menghubungi server.');
  }
}

export function bindAdminSettingsEvents(showToast: (m: string) => void): void {
  document.getElementById('btn-add-bank-row')?.addEventListener('click', () => {
    const name = (document.getElementById('new-bank-name') as HTMLInputElement)?.value.trim();
    const num = (document.getElementById('new-bank-number') as HTMLInputElement)?.value.trim();
    const holder = (document.getElementById('new-bank-holder') as HTMLInputElement)?.value.trim();
    if (!name || !num || !holder) return alert('Mohon isi nama bank, no rekening, dan atas nama!');
    (window as any)._adminBanks.push({ bankName: name, accountNumber: num, accountHolder: holder });
    renderBankList((window as any)._adminBanks);
    (document.getElementById('new-bank-name') as HTMLInputElement).value = '';
    (document.getElementById('new-bank-number') as HTMLInputElement).value = '';
    (document.getElementById('new-bank-holder') as HTMLInputElement).value = '';
  });

  document.getElementById('admin-settings-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    saveAdminSettings(showToast);
  });
}
