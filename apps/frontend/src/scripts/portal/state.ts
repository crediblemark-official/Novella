export interface CalcState {
  pages: number;
  copies: number;
  bookSize: string;
  printType: 'BW' | 'FC';
  paperType: 'bp57' | 'hvs70' | 'bp72' | 'hvs80' | string;
  coverType: 'Soft Cover' | 'Hard Cover';
  addons: string[];
  total: number;
  originalTotal: number;
  pricePerBook: number;
  shippingZone: string;
  shippingCost: number;
  estimatedWeightKg: number;
  useCargo: boolean;
}

export interface BookState {
  title: string;
  category: string;
  file: File | null;
  uploadedFileName: string;
  uploadedFileOriginalName: string;
  uploadedFileSize: number;
  uploadedFileMimeType: string;
}

export const calcState: CalcState = {
  pages: 100,
  copies: 5,
  bookSize: 'A5',
  printType: 'BW',
  paperType: 'bp57',
  coverType: 'Soft Cover',
  addons: [],
  total: 150000,
  originalTotal: 450000,
  pricePerBook: 30000,
  shippingZone: 'madura',
  shippingCost: 15000,
  estimatedWeightKg: 1,
  useCargo: false,
};

export const bookState: BookState = {
  title: '',
  category: 'Novel Sastra',
  file: null,
  uploadedFileName: '',
  uploadedFileOriginalName: '',
  uploadedFileSize: 0,
  uploadedFileMimeType: '',
};

export const portalState = {
  currentUser: null as any,
  createdOrder: null as any,
};

export const STORAGE_KEY = 'novella_portal_draft';

export function saveDraftState() {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ calcState, bookState }));
  } catch {}
}

export function loadDraftState() {
  try {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.calcState) Object.assign(calcState, parsed.calcState);
      if (parsed.bookState) Object.assign(bookState, parsed.bookState);
    }
  } catch {}
}
