// Drives the Activepieces embed SDK from the fictional "Helio" host shell.
// Init-time embedding options (everything sent in VENDOR_INIT) are persisted and
// applied by reloading, so the page always boots from a single clean configure()
// call — exactly how a real integration behaves. Live methods (navigate, connect,
// mcp*, request) run without a reload.

const STATE_KEY = 'helio-embed-state';
const DEFAULT_STATE = {
  role: 'ADMIN',
  mode: 'light',
  fontFamily: '',
  fontUrl: '',
  locale: 'en',
  hideSidebar: false,
  hideFlowsPageNavbar: false,
  hidePageHeader: false,
  disableNavigation: false,
  hideFlowName: false,
  homeButtonIcon: 'logo',
  homeHandler: false,
  hideExportAndImportFlow: false,
  hideDuplicateFlow: false,
  hideFolders: false,
  hideTables: false,
};

const $ = (id) => document.getElementById(id);
const state = loadState();
let config = null;

function loadState() {
  try {
    return { ...DEFAULT_STATE, ...JSON.parse(sessionStorage.getItem(STATE_KEY) || '{}') };
  } catch {
    return { ...DEFAULT_STATE };
  }
}

function persist() {
  sessionStorage.setItem(STATE_KEY, JSON.stringify(state));
}

function log(message, kind = '') {
  const line = document.createElement('div');
  line.className = 'log-line';
  const time = new Date().toLocaleTimeString();
  line.innerHTML = `<span class="log-time">${time}</span><span class="log-evt ${kind}">${kind || 'sdk'}</span><span class="log-msg"></span>`;
  line.querySelector('.log-msg').textContent = message;
  const box = $('log');
  box.prepend(line);
}

function setStatus(text, kind) {
  $('statusText').textContent = text;
  $('statusDot').className = `dot ${kind || ''}`;
}

function showBootError(message) {
  const el = $('bootError');
  el.hidden = false;
  el.innerHTML = `<div class="card"><h2>Embed failed to boot</h2><p>${message}</p><p class="muted">Check that the Activepieces instance is running, EE is enabled, and the signing key in <code>.embed-config.json</code> is valid. See the console for the full error.</p></div>`;
}

async function provisionToken() {
  const res = await fetch('/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role: state.role }),
  });
  if (!res.ok) {
    throw new Error(`Token endpoint returned ${res.status}: ${await res.text()}`);
  }
  return res.json();
}

function buildEmbeddingParam() {
  const param = {
    containerId: 'ap-container',
    styling: {
      mode: state.mode,
      ...(state.fontFamily ? { fontFamily: state.fontFamily } : {}),
      ...(state.fontUrl ? { fontUrl: state.fontUrl } : {}),
    },
    locale: state.locale,
    builder: {
      disableNavigation: state.disableNavigation,
      hideFlowName: state.hideFlowName,
      homeButtonIcon: state.homeButtonIcon,
    },
    dashboard: {
      hideSidebar: state.hideSidebar,
      hideFlowsPageNavbar: state.hideFlowsPageNavbar,
      hidePageHeader: state.hidePageHeader,
    },
    hideExportAndImportFlow: state.hideExportAndImportFlow,
    hideDuplicateFlow: state.hideDuplicateFlow,
    hideFolders: state.hideFolders,
    hideTables: state.hideTables,
    navigation: {
      handler: ({ route }) => {
        // The handler receives the route already prefixed (e.g. /automations/flows).
        // A real host pushes that to its router; here we mirror it into the hash,
        // storing the bare AP route so a reload can replay it via navigate().
        const prefix = config?.prefix ?? '';
        const apRoute = prefix && route.startsWith(prefix) ? route.slice(prefix.length) || '/' : route;
        log(`route → ${route}`, 'client');
        history.replaceState({}, '', `#${apRoute}`);
        $('urlSync').textContent = `Host URL synced → ${route}`;
      },
    },
  };
  if (state.homeHandler) {
    param.builder.homeButtonClickedHandler = ({ route }) => {
      log(`home button clicked from ${route} (host intercepts)`, 'action');
      alert(`Helio intercepted the builder home button.\nCame from: ${route}`);
    };
  }
  return param;
}

async function boot() {
  syncControlsFromState();
  try {
    config = await (await fetch('/api/config')).json();
    $('workspacePill').textContent = config.user?.projectDisplayName || 'Workspace';
    $('userName').textContent = `${config.user?.firstName ?? ''} ${config.user?.lastName ?? ''}`.trim() || 'User';
    $('userAvatar').textContent = (config.user?.firstName ?? 'U')[0];
  } catch (error) {
    showBootError('Could not reach the host backend (/api/config).');
    return;
  }

  if (typeof window.activepieces === 'undefined') {
    showBootError('The embed SDK did not load. Run <code>npm run bundle</code> inside <code>packages/ee/embed-sdk</code> and restart the server.');
    return;
  }

  setStatus('Provisioning…');
  let tokenResponse;
  try {
    tokenResponse = await provisionToken();
  } catch (error) {
    showBootError(`Failed to mint a JWT: ${error.message}`);
    return;
  }

  $('userRole').textContent = state.role;
  log(`configure() · role=${state.role} · mode=${state.mode} · locale=${state.locale}`, 'action');
  setStatus('Authenticating…');

  watchClientEvents(tokenResponse.instanceUrl);

  try {
    await window.activepieces.configure({
      instanceUrl: tokenResponse.instanceUrl,
      jwtToken: tokenResponse.token,
      prefix: tokenResponse.prefix,
      embedding: buildEmbeddingParam(),
    });
    setStatus('Embedded & authenticated', 'ok');
    log('CLIENT_CONFIGURATION_FINISHED — embed is live', 'client');
  } catch (error) {
    setStatus('Configuration failed', 'err');
    showBootError(`configure() rejected: ${typeof error === 'string' ? error : JSON.stringify(error)}`);
    return;
  }

  // Honor a deep link such as #/runs after a reload.
  const hashRoute = location.hash.replace(/^#/, '');
  if (hashRoute) {
    window.activepieces.navigate({ route: hashRoute });
  }
}

// Passive mirror of the postMessage protocol so the log shows the raw client events
// the SDK reacts to — the clearest signal that an embed change broke the handshake.
function watchClientEvents(instanceUrl) {
  let origin;
  try {
    origin = new URL(instanceUrl).origin;
  } catch {
    return;
  }
  window.addEventListener('message', (event) => {
    if (event.origin !== origin) return;
    const type = event.data?.type;
    if (typeof type === 'string' && type.startsWith('CLIENT_')) {
      log(type, type === 'CLIENT_AUTHENTICATION_FAILED' ? 'error' : 'client');
      if (type === 'CLIENT_AUTHENTICATION_FAILED') {
        setStatus('Authentication failed', 'err');
        showBootError('The instance rejected the embedding JWT. The signing key in <code>.embed-config.json</code> is not registered on this instance (or expired). Run <code>node setup.mjs</code> against the running instance to create a valid key.');
      }
    }
  });
}

/* ---------------- Live SDK actions ---------------- */

function wireNavigation() {
  document.querySelectorAll('[data-route]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const route = btn.getAttribute('data-route');
      log(`navigate({ route: "${route}" })`, 'action');
      window.activepieces.navigate({ route });
    });
  });
  $('routeGo').addEventListener('click', () => {
    const route = $('routeInput').value.trim();
    if (!route) return;
    log(`navigate({ route: "${route}" })`, 'action');
    window.activepieces.navigate({ route });
  });
}

function wireConnections() {
  const run = async (usedPopup) => {
    const pieceName = $('connectPiece').value.trim();
    const connectionName = $('connectName').value.trim() || undefined;
    log(`connect(${pieceName})${usedPopup ? ' [popup]' : ' [overlay]'}`, 'action');
    try {
      const result = await window.activepieces.connect({
        pieceName,
        connectionName,
        ...(usedPopup ? { newWindow: { width: 720, height: 760 } } : {}),
      });
      log(result.connection ? `connection saved: ${result.connection.name}` : 'connection dialog closed (no save)', 'action');
    } catch (error) {
      log(`connect failed: ${error?.error ?? error}`, 'error');
    }
  };
  $('connectIframe').addEventListener('click', () => run(false));
  $('connectPopup').addEventListener('click', () => run(true));
}

function wireMcp() {
  $('mcpSettings').addEventListener('click', async () => {
    log('mcpSettings() — opening overlay', 'action');
    await window.activepieces.mcpSettings();
    log('MCP settings dialog closed', 'client');
  });
  $('mcpToken').addEventListener('click', async () => {
    log('generateMcpToken()', 'action');
    try {
      const creds = await window.activepieces.generateMcpToken();
      const out = $('mcpResult');
      out.hidden = false;
      out.textContent = JSON.stringify(creds, null, 2);
      log('MCP token minted', 'action');
    } catch (error) {
      log(`generateMcpToken failed: ${error?.message ?? error}`, 'error');
    }
  });
  $('mcpAuthorize').addEventListener('click', async () => {
    const authRequestId = $('authRequestId').value.trim();
    if (!authRequestId) {
      log('authorizeMcp needs an authRequestId from a real /authorize redirect', 'error');
      return;
    }
    log(`authorizeMcp({ authRequestId: "${authRequestId}" })`, 'action');
    const result = await window.activepieces.authorizeMcp({ authRequestId });
    log(`authorizeMcp → ${JSON.stringify(result)}`, 'client');
  });
}

function wireRequests() {
  const show = (data) => {
    const out = $('reqResult');
    out.hidden = false;
    out.textContent = JSON.stringify(data, null, 2).slice(0, 4000);
  };
  $('reqWhoami').addEventListener('click', async () => {
    log('request(GET users/me)', 'action');
    try {
      show(await window.activepieces.request({ path: 'users/me', method: 'GET' }));
    } catch (error) {
      log(`request failed: ${error?.message ?? error}`, 'error');
    }
  });
  $('reqFlows').addEventListener('click', async () => {
    log('request(GET flows)', 'action');
    try {
      show(await window.activepieces.request({ path: 'flows', method: 'GET', queryParams: { limit: '5' } }));
    } catch (error) {
      log(`request failed: ${error?.message ?? error}`, 'error');
    }
  });
}

/* ---------------- Config controls (apply via reload) ---------------- */

function bindCheckbox(id) {
  const el = $(id);
  el.checked = state[id];
  el.addEventListener('change', () => { state[id] = el.checked; persist(); });
}

function bindInput(id) {
  const el = $(id);
  el.value = state[id] ?? '';
  el.addEventListener('input', () => { state[id] = el.value; persist(); });
}

function bindSelect(id) {
  const el = $(id);
  el.value = state[id];
  el.addEventListener('change', () => { state[id] = el.value; persist(); });
}

function syncControlsFromState() {
  bindSelect('role');
  bindSelect('locale');
  bindInput('fontFamily');
  bindInput('fontUrl');
  ['hideSidebar', 'hideFlowsPageNavbar', 'hidePageHeader', 'disableNavigation', 'hideFlowName',
    'homeHandler', 'hideExportAndImportFlow', 'hideDuplicateFlow', 'hideFolders', 'hideTables'].forEach(bindCheckbox);

  $('modeSeg').querySelectorAll('button').forEach((b) => b.classList.toggle('active', b.dataset.mode === state.mode));
  $('homeIconSeg').querySelectorAll('button').forEach((b) => b.classList.toggle('active', b.dataset.icon === state.homeButtonIcon));
  $('modeSeg').querySelectorAll('button').forEach((btn) => btn.addEventListener('click', () => {
    state.mode = btn.dataset.mode; persist();
    $('modeSeg').querySelectorAll('button').forEach((b) => b.classList.toggle('active', b === btn));
  }));
  $('homeIconSeg').querySelectorAll('button').forEach((btn) => btn.addEventListener('click', () => {
    state.homeButtonIcon = btn.dataset.icon; persist();
    $('homeIconSeg').querySelectorAll('button').forEach((b) => b.classList.toggle('active', b === btn));
  }));

  $('applyBtn').addEventListener('click', () => { persist(); location.reload(); });
  $('clearLog').addEventListener('click', () => { $('log').innerHTML = ''; });
}

wireNavigation();
wireConnections();
wireMcp();
wireRequests();
boot();
