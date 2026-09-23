/*
 * Family-Bee Google adapter.
 *
 * This browser adapter intentionally keeps access tokens in memory only. A
 * production deployment that needs durable background refresh should move the
 * OAuth code exchange and token vault to the Raspberry Pi companion service.
 */

const GOOGLE_SCOPES = [
  'openid',
  'email',
  'profile',
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/tasks',
].join(' ');

const GOOGLE_ENDPOINTS = {
  userInfo: 'https://www.googleapis.com/oauth2/v3/userinfo',
  calendars: 'https://www.googleapis.com/calendar/v3/users/me/calendarList',
  taskLists: 'https://tasks.googleapis.com/tasks/v1/users/@me/lists',
};

const demoAccount = {
  id: 'demo-family',
  name: 'Family preview account',
  email: 'preview@family-bee.local',
  status: 'demo',
  calendarCount: 3,
  taskListCount: 2,
  lastSync: 'Preview data',
};

class GoogleConnector {
  constructor() {
    this.accounts = [{ ...demoAccount }];
    this.listeners = new Set();
  }

  get configured() {
    return Boolean(window.FAMILY_BEE_CONFIG?.googleClientId && !window.FAMILY_BEE_CONFIG.googleClientId.includes('YOUR_'));
  }

  get hasGoogleIdentity() {
    return Boolean(window.google?.accounts?.oauth2);
  }

  listAccounts() { return [...this.accounts]; }
  subscribe(listener) { this.listeners.add(listener); return () => this.listeners.delete(listener); }
  notify() { this.listeners.forEach((listener) => listener(this.listAccounts())); }

  addPreviewAccount() {
    if (this.accounts.some((account) => account.status === 'demo')) return this.accounts[0];
    this.accounts.push({ ...demoAccount });
    this.notify();
    return this.accounts.at(-1);
  }

  async connect({ loginHint = '' } = {}) {
    if (!this.configured || !this.hasGoogleIdentity) return { status: 'configuration-required' };

    return new Promise((resolve) => {
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: window.FAMILY_BEE_CONFIG.googleClientId,
        scope: GOOGLE_SCOPES,
        callback: async (tokenResponse) => {
          if (tokenResponse.error) return resolve({ status: 'error', error: tokenResponse.error });
          try {
            const profile = await this.requestWithToken(tokenResponse.access_token, GOOGLE_ENDPOINTS.userInfo);
            const account = {
              id: profile.sub,
              name: profile.name || profile.email,
              email: profile.email,
              avatar: profile.picture,
              status: 'connected',
              accessToken: tokenResponse.access_token,
              expiresAt: Date.now() + ((tokenResponse.expires_in || 3600) * 1000),
              calendarCount: 0,
              taskListCount: 0,
              lastSync: 'Syncing…',
            };
            this.accounts = this.accounts.filter((item) => item.id !== account.id);
            this.accounts.push(account);
            this.notify();
            await this.syncAccount(account);
            resolve({ status: 'connected', account });
          } catch (error) {
            resolve({ status: 'error', error: error.message });
          }
        },
        error_callback: (error) => resolve({ status: 'error', error: error.type || 'Google authorisation failed' }),
      });
      client.requestAccessToken({ prompt: 'select_account', ...(loginHint ? { login_hint: loginHint } : {}) });
    });
  }

  async requestWithToken(accessToken, url, options = {}) {
    const response = await fetch(url, { ...options, headers: { ...(options.headers || {}), Authorization: `Bearer ${accessToken}` } });
    if (!response.ok) throw new Error(`Google API returned ${response.status}`);
    return response.json();
  }

  async syncAccount(account) {
    if (account.status !== 'connected') return account;
    const [calendars, taskLists] = await Promise.all([
      this.requestWithToken(account.accessToken, GOOGLE_ENDPOINTS.calendars),
      this.requestWithToken(account.accessToken, GOOGLE_ENDPOINTS.taskLists),
    ]);
    account.calendarCount = calendars.items?.length || 0;
    account.taskListCount = taskLists.items?.length || 0;
    account.lastSync = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    account.calendars = calendars.items || [];
    account.taskLists = taskLists.items || [];
    this.notify();
    return account;
  }

  removeAccount(accountId) {
    this.accounts = this.accounts.filter((account) => account.id !== accountId);
    this.notify();
  }
}

window.FamilyBeeGoogle = new GoogleConnector();
window.FamilyBeeGoogle.scopes = GOOGLE_SCOPES;

