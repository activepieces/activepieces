import { describe, expect, it, vi } from 'vitest';

vi.mock('i18next', () => ({
  default: { language: 'en-US' },
  t: (key: string) => key,
}));

const { mcpClientCatalog } = await import(
  '@/app/routes/mcp-server/mcp-client-catalog'
);

const SERVER_URL = 'https://cloud.activepieces.com/mcp';

function clientNamed(key: string, isCloud: boolean) {
  return mcpClientCatalog
    .clients({
      serverUrl: SERVER_URL,
      websiteName: 'Activepieces',
      isCloud,
    })
    .find((client) => client.key === key);
}

function method(clientKey: string, methodKey: string, isCloud = false) {
  return clientNamed(clientKey, isCloud)?.methods.find(
    (item) => item.key === methodKey,
  );
}

describe('mcpClientCatalog cloud overrides', () => {
  it('offers the Claude directory first on cloud only', () => {
    const cloud = clientNamed('claude', true);
    expect(cloud?.methods.map((item) => item.key)).toEqual([
      'directory',
      'connector',
    ]);
    expect(cloud?.methods[0].steps[0].action?.href).toBe(
      'https://claude.ai/directory/cloud-activepieces-com',
    );
    const selfHosted = clientNamed('claude', false);
    expect(selfHosted?.methods.map((item) => item.key)).toEqual(['connector']);
    expect(selfHosted?.methods[0].steps[0].action?.href).toContain(
      'add-custom-connector',
    );
  });

  it('leaves clients without a cloud listing untouched', () => {
    expect(clientNamed('codex', true)).toEqual(clientNamed('codex', false));
  });

  it('points Cursor docs at its directory listing on cloud only', () => {
    expect(clientNamed('cursor', true)?.docsUrl).toBe(
      'https://cursor.directory/plugins/activepieces-mcp-connector-for-cursor',
    );
    expect(clientNamed('cursor', false)?.docsUrl).toBe(
      'https://cursor.com/docs/mcp',
    );
    expect(clientNamed('cursor', true)?.methods).toEqual(
      clientNamed('cursor', false)?.methods,
    );
  });

  it('offers a Gemini CLI config file with httpUrl', () => {
    const config = method('gemini-cli', 'config');
    expect(config?.steps[0].block?.label).toBe('~/.gemini/settings.json');
    expect(JSON.parse(config?.steps[0].block?.text ?? '{}')).toEqual({
      mcpServers: { activepieces: { httpUrl: SERVER_URL } },
    });
  });
});

describe('mcpClientCatalog generated commands', () => {
  it('encodes the server url into the Cursor deep link', () => {
    const href = method('cursor', 'deeplink')?.steps[0].action?.href ?? '';
    const config = new URL(href).searchParams.get('config') ?? '';
    expect(JSON.parse(atob(config))).toEqual({ url: SERVER_URL });
  });

  it('encodes the server url into the VS Code deep link', () => {
    const href = method('vscode', 'deeplink')?.steps[0].action?.href ?? '';
    expect(JSON.parse(decodeURIComponent(href.split('?')[1]))).toEqual({
      name: 'activepieces',
      type: 'http',
      url: SERVER_URL,
    });
  });

  it('builds the Claude Code add and login commands', () => {
    const steps = method('claude-code', 'terminal')?.steps ?? [];
    expect(steps.map((step) => step.block?.text)).toEqual([
      `claude mcp add --transport http activepieces ${SERVER_URL}`,
      'claude mcp login activepieces',
    ]);
  });

  it('asks Codex, Gemini CLI and OpenCode to sign in explicitly', () => {
    expect(method('codex', 'terminal')?.steps[1].block?.text).toBe(
      'codex mcp login activepieces',
    );
    expect(method('gemini-cli', 'terminal')?.steps[1].block?.text).toBe(
      '/mcp auth activepieces',
    );
    expect(method('opencode', 'config')?.steps[1].block?.text).toBe(
      'opencode mcp auth activepieces',
    );
  });
});

describe('mcpClientCatalog.resolveKey', () => {
  it('sends old Windsurf links to the Devin Desktop client', () => {
    const key = mcpClientCatalog.resolveKey('windsurf');
    expect(key).toBe('devin');
    expect(clientNamed(key, false)?.name).toBe('Devin Desktop');
  });

  it('keeps every current client key as it is', () => {
    const keys = mcpClientCatalog
      .clients({
        serverUrl: SERVER_URL,
        websiteName: 'Activepieces',
        isCloud: false,
      })
      .map((client) => client.key);
    expect(keys.map((key) => mcpClientCatalog.resolveKey(key))).toEqual(keys);
  });
});

describe('mcpClientCatalog grant keys', () => {
  it('maps Devin Desktop to the windsurf grant and leaves undetected clients unmapped', () => {
    expect(clientNamed('devin', false)?.grantKey).toBe('windsurf');
    expect(clientNamed('cline', false)?.grantKey).toBeNull();
    expect(clientNamed('antigravity', false)?.grantKey).toBeNull();
  });

  it('lists every client with its recommended method first', () => {
    const clients = mcpClientCatalog.clients({
      serverUrl: SERVER_URL,
      websiteName: 'Activepieces',
      isCloud: false,
    });
    expect(clients).toHaveLength(12);
    expect(clients.every((client) => client.methods.length > 0)).toBe(true);
  });
});
