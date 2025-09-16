// src/app.js
// /src/app.js

import { searchRepos, getRepoTopics } from './api.js';
import { initModal, openModal, closeModal, buildRepoModalContent } from './modal.js';
import { setStatus, clearCards, renderCards, updatePagination, onCardsClick, onPrev, onNext } from './render.js';

const DEFAULT_QUERY = 'stars:>10000';
const PER_PAGE = 10;
const SS_KEYS = { q: 'gh.q', page: 'gh.page' };
const THEME_KEY = 'gh.theme';

const $q = document.getElementById('q');
const $clear = document.querySelector('.search__clear');
const $theme = document.getElementById('theme-toggle');

let state = {
  query: DEFAULT_QUERY,
  page: 1,
  totalPages: 1,
  loading: false
};

init();

function init() {
  initModal();
  hydrateFromSession();
  bindUI();
  applySavedTheme();
  // Primera carga
  void load();
}

function hydrateFromSession() {
  const q = sessionStorage.getItem(SS_KEYS.q);
  const page = Number(sessionStorage.getItem(SS_KEYS.page) || '1');
  state.query = (q && q.trim()) ? q : DEFAULT_QUERY;
  state.page = Number.isFinite(page) && page > 0 ? page : 1;

  // Reflejar en input (si es default no ensuciar)
  $q.value = (state.query === DEFAULT_QUERY) ? '' : state.query;
}

function bindUI() {
  // Búsqueda con debounce
  $q.addEventListener('input', debounce(async () => {
    const value = $q.value.trim();
    state.query = value || DEFAULT_QUERY;
    state.page = 1;
    await load();
  }, 400));

  // Limpiar búsqueda
  $clear.addEventListener('click', async () => {
    $q.value = '';
    if (state.query !== DEFAULT_QUERY) {
      state.query = DEFAULT_QUERY;
      state.page = 1;
      await load();
    }
    $q.focus();
  });

  // Paginación
  onPrev(async () => {
    if (state.page > 1) {
      state.page -= 1;
      await load();
    }
  });
  onNext(async () => {
    if (state.page < state.totalPages) {
      state.page += 1;
      await load();
    }
  });

  // Click en tarjeta → modal
  onCardsClick(async (cardEl, repoData) => {
    try {
      const topics = await getRepoTopics(repoData.owner?.login, repoData.name);
      const modal = buildRepoModalContent(repoData, topics);
      openModal({ title: modal.title, html: modal.html, returnFocusTo: cardEl });
    } catch {
      const modal = buildRepoModalContent(repoData, []);
      openModal({ title: modal.title, html: modal.html, returnFocusTo: cardEl });
    }
  });

  // Tema
  $theme.addEventListener('click', toggleTheme);
}

async function load() {
  if (state.loading) return;
  state.loading = true;

  setStatus('Cargando…', { busy: true });
  clearCards();

  try {
    const data = await searchRepos(state.query, state.page, PER_PAGE);
    const totalCount = Math.min(data.total_count ?? 0, 1000); // límite de búsqueda
    state.totalPages = Math.max(1, Math.ceil(totalCount / PER_PAGE));

    if (!data.items || data.items.length === 0) {
      renderCards([]);
      updatePagination(1, 1);
      setStatus('Sin resultados.', { tone: 'muted', busy: false });
    } else {
      renderCards(data.items);
      updatePagination(state.page, state.totalPages);
      setStatus(`Mostrando ${data.items.length} resultados (página ${state.page} de ${state.totalPages}).`, { busy: false });
    }

    // Persistir
    sessionStorage.setItem(SS_KEYS.q, state.query);
    sessionStorage.setItem(SS_KEYS.page, String(state.page));
  } catch (err) {
    const msg = String(err?.message || 'Error inesperado');
    if (msg === 'RATE_LIMIT') {
      setStatus('Se alcanzó el límite de la API de GitHub. Inténtalo más tarde.', { tone: 'error', busy: false });
    } else {
      setStatus(`Ocurrió un error: ${msg}`, { tone: 'error', busy: false });
    }
    renderCards([]);
    updatePagination(1, 1);
  } finally {
    state.loading = false;
  }
}

/* ===== Helpers ===== */

function debounce(fn, ms = 300) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn.apply(null, args), ms);
  };
}

function applySavedTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  if (!saved || saved === 'auto') {
    document.documentElement.setAttribute('data-theme', 'auto');
    $theme.setAttribute('aria-pressed', 'false');
    return;
  }
  document.documentElement.setAttribute('data-theme', saved);
  $theme.setAttribute('aria-pressed', saved === 'dark' ? 'true' : 'false');
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'auto';
  let next;
  if (current === 'auto') {
    // elegir según media query
    const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)')?.matches;
    next = prefersDark ? 'light' : 'dark';
  } else if (current === 'dark') {
    next = 'light';
  } else {
    next = 'dark';
  }
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem(THEME_KEY, next);
  $theme.setAttribute('aria-pressed', next === 'dark' ? 'true' : 'false');
}
