// src/modal.js
// /src/modal.js

let modalEl, overlayEl, closeBtn, contentEl, titleEl;
let isOpen = false;
let lastFocus = null;

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])'
].join(',');

function focusTrap(e) {
  if (!isOpen || e.key !== 'Tab') return;
  const focusables = modalEl.querySelectorAll(FOCUSABLE);
  if (focusables.length === 0) return;
  const first = focusables[0];
  const last = focusables[focusables.length - 1];

  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault(); last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault(); first.focus();
  }
}

function onKeydown(e) {
  if (!isOpen) return;
  if (e.key === 'Escape') {
    e.preventDefault();
    closeModal();
  } else {
    focusTrap(e);
  }
}

export function initModal() {
  modalEl = document.getElementById('modal');
  overlayEl = modalEl.querySelector('.modal__overlay');
  closeBtn = modalEl.querySelector('.modal__close');
  contentEl = document.getElementById('modal-content');
  titleEl = document.getElementById('modal-title');

  overlayEl.addEventListener('click', onBackdropClick, false);
  closeBtn.addEventListener('click', closeModal, false);
  document.addEventListener('keydown', onKeydown, false);
}

function onBackdropClick(ev) {
  if (ev.target === overlayEl || ev.target?.dataset?.close === 'true') {
    closeModal();
  }
}

export function openModal({ title, html, returnFocusTo }) {
  if (!modalEl) initModal();
  lastFocus = returnFocusTo || document.activeElement;

  titleEl.textContent = title ?? 'Detalles';
  contentEl.innerHTML = html ?? '';
  modalEl.setAttribute('aria-hidden', 'false');
  isOpen = true;

  // Enfocar primer foco disponible
  const focusable = modalEl.querySelector(FOCUSABLE);
  (focusable ?? closeBtn).focus();
}

export function closeModal() {
  if (!isOpen) return;
  modalEl.setAttribute('aria-hidden', 'true');
  isOpen = false;
  contentEl.innerHTML = '';
  // Volver el foco
  if (lastFocus && typeof lastFocus.focus === 'function') {
    lastFocus.focus();
  }
}

/**
 * Crea contenido de modal para un repo.
 * @param {object} repo - elemento de búsqueda de GitHub
 * @param {string[]} topics
 * @returns {{title: string, html: string}}
 */
export function buildRepoModalContent(repo, topics = []) {
  const {
    full_name,
    description,
    owner,
    language,
    html_url
  } = repo;

  const safeDesc = description || 'Sin descripción.';
  const lang = language || '—';

  const chips = topics.map(t => `<span class="chip">${escapeHtml(t)}</span>`).join('');

  const html = `
    <div id="modal-desc" class="modal__body">
      <img class="modal__avatar" src="${owner?.avatar_url}" width="88" height="88" alt="Avatar de ${escapeHtml(owner?.login || '')}">
      <div>
        <p class="modal__row"><strong>Repositorio:</strong> ${escapeHtml(full_name)}</p>
        <p class="modal__row"><strong>Lenguaje:</strong> ${escapeHtml(lang)}</p>
        <p class="modal__row"><a href="${html_url}" target="_blank" rel="noopener noreferrer">Abrir en GitHub ↗</a></p>
      </div>
    </div>
    <p class="modal__desc">${escapeHtml(safeDesc)}</p>
    ${chips ? `<div class="chips" aria-label="Temas del repositorio">${chips}</div>` : ''}
  `.trim();

  return { title: full_name, html };
}

function escapeHtml(str = '') {
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
