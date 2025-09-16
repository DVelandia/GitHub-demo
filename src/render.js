// src/render.js
// /src/render.js

const cardsEl = document.getElementById('cards');
const statusEl = document.getElementById('status');
const prevBtn = document.getElementById('prev');
const nextBtn = document.getElementById('next');
const pageIndicator = document.getElementById('page-indicator');

export function setStatus(text = '', { tone = 'neutral', busy = false } = {}) {
  statusEl.textContent = text;
  statusEl.dataset.tone = tone;
  statusEl.setAttribute('aria-busy', busy ? 'true' : 'false');
}

export function clearCards() {
  cardsEl.innerHTML = '';
}

export function renderCards(items = []) {
  const frag = document.createDocumentFragment();
  for (const repo of items) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'card';
    btn.setAttribute('aria-label', `Abrir detalles del repositorio ${repo.full_name}`);
    btn.dataset.owner = repo.owner?.login ?? '';
    btn.dataset.name = repo.name ?? '';
    btn.dataset.repo = JSON.stringify(compactRepo(repo)); // datos para modal

    const title = document.createElement('h3');
    title.className = 'card__title';
    title.textContent = repo.name;

    const owner = document.createElement('div');
    owner.className = 'card__owner';
    owner.textContent = repo.owner?.login ?? '—';

    const meta = document.createElement('div');
    meta.className = 'card__meta';
    meta.innerHTML = `⭐ ${formatNumber(repo.stargazers_count)} · ${repo.language ?? '—'}`;

    const desc = document.createElement('p');
    desc.className = 'card__desc';
    desc.textContent = repo.description ?? 'Sin descripción.';

    btn.append(title, owner, meta, desc);
    frag.appendChild(btn);
  }
  cardsEl.innerHTML = '';
  cardsEl.appendChild(frag);
}

export function updatePagination(page, totalPages) {
  pageIndicator.textContent = `Página ${page} de ${totalPages}`;
  prevBtn.disabled = page <= 1;
  nextBtn.disabled = page >= totalPages;
}

export function renderSkeleton(count = 10) {
  const frag = document.createDocumentFragment();
  for (let i = 0; i < count; i += 1) {
    const sk = document.createElement('div');
    sk.className = 'card skeleton';
    sk.innerHTML = `
      <div class="sk sk-title"></div>
      <div class="sk sk-sub"></div>
      <div class="sk sk-meta"></div>
      <div class="sk sk-desc"></div>
    `;
    frag.appendChild(sk);
  }
  cardsEl.innerHTML = '';
  cardsEl.appendChild(frag);
}

export function onCardsClick(handler) {
  cardsEl.addEventListener('click', (ev) => {
    const card = ev.target.closest('.card');
    if (!card) return;
    handler(card, JSON.parse(card.dataset.repo || '{}'));
  });
}

export function onPrev(handler) { prevBtn.addEventListener('click', handler); }
export function onNext(handler) { nextBtn.addEventListener('click', handler); }

function formatNumber(n) {
  try {
    return new Intl.NumberFormat('es').format(n ?? 0);
  } catch {
    return String(n ?? 0);
  }
}

function compactRepo(repo) {
  // Reducir tamaño guardado en data- para evitar exceso
  return {
    full_name: repo.full_name,
    name: repo.name,
    description: repo.description,
    language: repo.language,
    html_url: repo.html_url,
    owner: { login: repo.owner?.login, avatar_url: repo.owner?.avatar_url }
  };
}
