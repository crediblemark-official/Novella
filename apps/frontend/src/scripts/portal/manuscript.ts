import { formatBytes } from '../../utils/formatters';
import { bookState, saveDraftState } from './state';
import { API_BASE } from './api';
import { setStep } from './router';

export function bindManuscriptEvents() {
  const dropzone = document.getElementById('dropzone');
  const fileInput = document.getElementById('file-input') as HTMLInputElement | null;
  const fileStatusBox = document.getElementById('file-status-box');
  const fileNameLabel = document.getElementById('file-name-label');
  const fileSizeLabel = document.getElementById('file-size-label');
  const uploadProgressBarWrap = document.getElementById('upload-progress-bar-wrap');
  const uploadProgressBar = document.getElementById('upload-progress-bar');
  const fileUploadMsg = document.getElementById('file-upload-msg');
  const bookMetaForm = document.getElementById('book-meta-form') as HTMLFormElement | null;
  const inputBookTitle = document.getElementById('input-book-title') as HTMLInputElement | null;
  const selectBookCategory = document.getElementById('select-book-category') as HTMLSelectElement | null;
  const bookFormError = document.getElementById('book-form-error');

  if (dropzone && fileInput) {
    dropzone.addEventListener('click', () => fileInput.click());
    dropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropzone.classList.add('border-orange', 'bg-orange/5');
    });
    dropzone.addEventListener('dragleave', () => {
      dropzone.classList.remove('border-orange', 'bg-orange/5');
    });
    dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropzone.classList.remove('border-orange', 'bg-orange/5');
      if (e.dataTransfer?.files && e.dataTransfer.files[0]) {
        handleFileSelect(e.dataTransfer.files[0]);
      }
    });
    fileInput.addEventListener('change', () => {
      if (fileInput.files && fileInput.files[0]) {
        handleFileSelect(fileInput.files[0]);
      }
    });
  }

  async function handleFileSelect(file: File) {
    const allowed = ['.pdf', '.doc', '.docx', '.txt'];
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!allowed.includes(ext)) {
      if (bookFormError) {
        bookFormError.textContent = 'Format berkas tidak didukung. Harap unggah PDF, DOC, DOCX, atau TXT.';
        bookFormError.classList.remove('hidden');
      }
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      if (bookFormError) {
        bookFormError.textContent = 'Ukuran berkas melebihi 50 MB.';
        bookFormError.classList.remove('hidden');
      }
      return;
    }

    if (bookFormError) bookFormError.classList.add('hidden');
    bookState.file = file;

    if (fileNameLabel) fileNameLabel.textContent = file.name;
    if (fileSizeLabel) fileSizeLabel.textContent = formatBytes(file.size);
    if (fileStatusBox) fileStatusBox.classList.remove('hidden');
    if (uploadProgressBarWrap) uploadProgressBarWrap.classList.remove('hidden');
    if (uploadProgressBar) uploadProgressBar.style.width = '10%';
    if (fileUploadMsg) {
      fileUploadMsg.textContent = 'Mengunggah naskah...';
      fileUploadMsg.className = 'mt-1 text-[11px] font-bold text-orange';
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      if (uploadProgressBar) uploadProgressBar.style.width = '60%';
      const res = await fetch(`${API_BASE}/upload`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        bookState.uploadedFileName = data.fileName;
        bookState.uploadedFileOriginalName = data.originalName;
        bookState.uploadedFileSize = data.size;
        bookState.uploadedFileMimeType = data.mimeType;

        if (uploadProgressBar) uploadProgressBar.style.width = '100%';
        if (fileUploadMsg) {
          fileUploadMsg.textContent = '✓ Berkas naskah berhasil diunggah dan terkunci aman.';
          fileUploadMsg.className = 'mt-1 text-[11px] font-bold text-emerald-600';
        }
        saveDraftState();
      } else {
        throw new Error(data.error || 'Gagal mengunggah');
      }
    } catch {
      if (fileUploadMsg) {
        fileUploadMsg.textContent = 'Gagal mengunggah berkas. Coba lagi.';
        fileUploadMsg.className = 'mt-1 text-[11px] font-bold text-rose-600';
      }
    }
  }

  if (bookMetaForm) {
    bookMetaForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const title = inputBookTitle?.value.trim() || '';
      const category = selectBookCategory?.value || 'Novel Populer';

      if (!title) {
        if (bookFormError) {
          bookFormError.textContent = 'Mohon masukkan judul buku.';
          bookFormError.classList.remove('hidden');
        }
        return;
      }

      if (!bookState.uploadedFileName) {
        if (bookFormError) {
          bookFormError.textContent = 'Mohon unggah berkas naskah digital Anda.';
          bookFormError.classList.remove('hidden');
        }
        return;
      }

      if (bookFormError) bookFormError.classList.add('hidden');
      bookState.title = title;
      bookState.category = category;
      saveDraftState();
      setStep(3, true);
    });
  }
}
