const features = [
  { id: 'calendar', name: 'Family calendar', description: 'Shared events, school runs and appointments in one view.', category: 'family', icon: '▦', colour: '#ba8b35', accent: '#fff4d7', active: true, meta: 'Google · iCloud' },
  { id: 'photos', name: 'Photo moments', description: 'Rotate favourite memories from a local album or cloud drive.', category: 'family', icon: '▧', colour: '#c87965', accent: '#fbe8e2', active: true, meta: 'Local album' },
  { id: 'weather', name: 'Weather', description: 'Current conditions and a simple outlook for your location.', category: 'home', icon: '☼', colour: '#6e98ae', accent: '#e4f0f4', active: true, meta: 'Open-Meteo' },
  { id: 'tasks', name: 'Tasks & chores', description: 'Make the next small job visible and share the load.', category: 'family', icon: '✓', colour: '#77977d', accent: '#e7f0e7', active: true, meta: 'Family list' },
  { id: 'meals', name: 'Meal planner', description: 'Know what is for dinner before anyone has to ask.', category: 'family', icon: '♡', colour: '#c47d4e', accent: '#f8e8db', active: true, meta: 'Local only' },
  { id: 'shopping', name: 'Shopping list', description: 'Keep the next shop visible and optionally mirror it to Google Tasks.', category: 'family', icon: '⌑', colour: '#bf765b', accent: '#fae8df', active: true, meta: 'Local · Tasks' },
  { id: 'home', name: 'Smart home', description: 'Bring lights, heating and home controls to the wall.', category: 'home', icon: '⌂', colour: '#8a83a8', accent: '#eeebf8', active: false, meta: 'Home Assistant' },
  { id: 'transport', name: 'Travel time', description: 'See the school, work or station journey at a glance.', category: 'home', icon: '↗', colour: '#6d9a8e', accent: '#e4f1ec', active: true, meta: 'Open route' },
  { id: 'news', name: 'News & notices', description: 'A calm, optional feed for local updates and reminders.', category: 'family', icon: '≡', colour: '#8a8f96', accent: '#eceef0', active: false, meta: 'RSS feeds' },
  { id: 'notes', name: 'Family notes', description: 'Leave a short message where everyone will see it.', category: 'home', icon: '✎', colour: '#ae7e61', accent: '#f5e9df', active: false, meta: 'Local only' },
];

const state = { filter: 'all', query: '', sort: 'recommended' };
const grid = document.querySelector('#feature-grid');
const emptyState = document.querySelector('#empty-state');

function activeFeatures() { return features.filter((feature) => feature.active); }

function render() {
  let visible = features.filter((feature) => {
    const matchesQuery = `${feature.name} ${feature.description} ${feature.meta}`.toLowerCase().includes(state.query.toLowerCase());
    const matchesFilter = state.filter === 'all' || (state.filter === 'active' && feature.active) || feature.category === state.filter;
    return matchesQuery && matchesFilter;
  });

  if (state.sort === 'alphabetical') visible.sort((a, b) => a.name.localeCompare(b.name));
  if (state.sort === 'status') visible.sort((a, b) => Number(b.active) - Number(a.active));

  grid.innerHTML = visible.map((feature) => `
    <article class="feature-card ${feature.active ? 'is-active' : ''}" data-feature-id="${feature.id}" style="--card-colour:${feature.colour};--card-accent:${feature.accent}">
      <div class="feature-top"><span class="feature-icon" aria-hidden="true">${feature.icon}</span><button class="toggle" type="button" aria-label="Toggle ${feature.name}" aria-pressed="${feature.active}"></button></div>
      <h3>${feature.name}</h3><p>${feature.description}</p>
      <div class="card-meta"><span class="${feature.active ? 'active-label' : ''}">${feature.active ? 'Active' : 'Off'}</span><span>·</span><span>${feature.meta}</span></div>
    </article>`).join('');

  emptyState.hidden = visible.length > 0;
  const count = activeFeatures().length;
  document.querySelector('#active-count').textContent = count;
  document.querySelector('#active-filter-count').textContent = count;
  document.querySelector('#feature-total').textContent = features.length;
  document.querySelector('#all-filter-count').textContent = features.length;
  document.querySelector('#progress-bar').style.width = `${Math.round((count / features.length) * 100)}%`;
  document.querySelector('.nav-count').textContent = count;
}

grid.addEventListener('click', (event) => {
  const toggle = event.target.closest('.toggle');
  if (!toggle) return;
  const card = toggle.closest('[data-feature-id]');
  const feature = features.find((item) => item.id === card.dataset.featureId);
  feature.active = !feature.active;
  render();
});

document.querySelector('#feature-search').addEventListener('input', (event) => { state.query = event.target.value; render(); });
document.querySelector('#sort-features').addEventListener('change', (event) => { state.sort = event.target.value; render(); });
document.querySelectorAll('.filter-button').forEach((button) => button.addEventListener('click', () => {
  state.filter = button.dataset.filter;
  document.querySelectorAll('.filter-button').forEach((item) => item.classList.toggle('selected', item === button));
  render();
}));

document.querySelector('[data-action="all-on"]').addEventListener('click', () => { features.forEach((feature) => { feature.active = true; }); render(); });
document.querySelector('[data-action="reset"]').addEventListener('click', () => {
  const defaults = ['calendar', 'photos', 'weather', 'tasks', 'meals', 'shopping', 'transport'];
  features.forEach((feature) => { feature.active = defaults.includes(feature.id); });
  render();
});
document.querySelector('[data-action="save"]').addEventListener('click', (event) => {
  const button = event.currentTarget;
  const original = button.innerHTML;
  button.innerHTML = 'Saved <span>✓</span>';
  setTimeout(() => { button.innerHTML = original; }, 1400);
});

const previewDialog = document.querySelector('#preview-dialog');
document.querySelectorAll('[data-action="preview"]').forEach((button) => button.addEventListener('click', () => previewDialog.showModal()));
document.querySelectorAll('[data-action="close-preview"]').forEach((button) => button.addEventListener('click', () => previewDialog.close()));

const googleConnector = window.FamilyBeeGoogle;
const accountsContainer = document.querySelector('#google-accounts');
const connectionDialog = document.querySelector('#connection-dialog');
const connectionStatus = document.querySelector('#connection-dialog-status');

function escapeHtml(value = '') {
  return String(value).replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;' }[character]));
}

function accountInitials(account) {
  return (account.name || account.email || 'G').split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
}

function renderGoogleAccounts(accounts = googleConnector.listAccounts()) {
  accountsContainer.innerHTML = accounts.map((account) => `
    <div class="google-account" data-account-id="${escapeHtml(account.id)}">
      <span class="google-avatar">${account.avatar ? `<img src="${escapeHtml(account.avatar)}" alt="" />` : accountInitials(account)}</span>
      <span class="google-account-copy"><b>${escapeHtml(account.name)}</b><small>${escapeHtml(account.email)}</small></span>
      <span class="account-state ${account.status === 'demo' ? 'demo' : ''}">${account.status === 'demo' ? 'Preview' : 'Connected'}<small>${escapeHtml(account.lastSync || 'Not synced')}</small></span>
      <button class="account-remove" type="button" data-remove-account="${escapeHtml(account.id)}" aria-label="Remove ${escapeHtml(account.name)}">×</button>
    </div>`).join('');
}

googleConnector.subscribe(renderGoogleAccounts);
accountsContainer.addEventListener('click', (event) => {
  const removeButton = event.target.closest('[data-remove-account]');
  if (removeButton) googleConnector.removeAccount(removeButton.dataset.removeAccount);
});

document.querySelector('[data-action="add-google"]').addEventListener('click', () => {
  connectionStatus.textContent = googleConnector.configured
    ? 'Google is configured. Continue to choose which account to add.'
    : 'Live connection requires a Google OAuth client ID in config.js. Preview mode is available now.';
  connectionDialog.showModal();
});

document.querySelectorAll('[data-action="close-connection"]').forEach((button) => button.addEventListener('click', () => connectionDialog.close()));
document.querySelector('[data-action="connect-google"]').addEventListener('click', async (event) => {
  const button = event.currentTarget;
  button.disabled = true;
  button.textContent = 'Connecting…';
  const result = await googleConnector.connect();
  if (result.status === 'configuration-required') {
    connectionStatus.textContent = 'Preview account remains available. Copy config.example.js to config.js and add a Google OAuth client ID for live accounts.';
    googleConnector.addPreviewAccount();
  } else if (result.status === 'connected') {
    connectionDialog.close();
  } else {
    connectionStatus.textContent = `Google connection failed: ${result.error || 'try again'}.`;
  }
  button.disabled = false;
  button.innerHTML = 'Connect with Google <span>↗</span>';
});

document.querySelector('[data-action="refresh-google"]').addEventListener('click', async (event) => {
  const button = event.currentTarget;
  const original = button.innerHTML;
  button.textContent = 'Refreshing…';
  const connectedAccounts = googleConnector.listAccounts().filter((account) => account.status === 'connected');
  await Promise.all(connectedAccounts.map((account) => googleConnector.syncAccount(account)));
  button.innerHTML = connectedAccounts.length ? 'Updated <span>✓</span>' : 'Preview data <span>✓</span>';
  setTimeout(() => { button.innerHTML = original; }, 1400);
});

renderGoogleAccounts();
render();

