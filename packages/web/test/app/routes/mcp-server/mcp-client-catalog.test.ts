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

describe('mcpClientCatalog cloud overrides', () => {
  it('sends Claude to the directory listing on cloud only', () => {
    expect(clientNamed('claude', true)?.instructions[0].action?.href).toBe(
      'https://claude.ai/directory/cloud-activepieces-com',
    );
    expect(clientNamed('claude', false)?.instructions[0].action?.href).toContain(
      'add-custom-connector',
    );
  });

  it('leaves clients without a cloud override untouched', () => {
    expect(clientNamed('codex', true)).toEqual(clientNamed('codex', false));
  });

  it('keeps the Cursor deep link on cloud and only swaps the docs link', () => {
    const cloudCursor = clientNamed('cursor', true);
    expect(cloudCursor?.docsUrl).toBe(
      'https://cursor.directory/plugins/activepieces-mcp-connector-for-cursor',
    );
    expect(cloudCursor?.instructions[0]).toEqual(
      clientNamed('cursor', false)?.instructions[0],
    );
  });
});

describe('mcpClientCatalog generated commands', () => {
  it('encodes the server url into the Cursor deep link', () => {
    const href =
      clientNamed('cursor', false)?.instructions[0].action?.href ?? '';
    const config = new URL(href).searchParams.get('config') ?? '';
    expect(JSON.parse(atob(config))).toEqual({ url: SERVER_URL });
  });

  it('encodes the server url into the VS Code deep link', () => {
    const href =
      clientNamed('vscode', false)?.instructions[0].action?.href ?? '';
    expect(JSON.parse(decodeURIComponent(href.split('?')[1]))).toEqual({
      name: 'activepieces',
      type: 'http',
      url: SERVER_URL,
    });
  });

  it('builds the Claude Code add command', () => {
    expect(clientNamed('claude-code', false)?.instructions[0].command).toBe(
      `claude mcp add --transport http activepieces ${SERVER_URL}`,
    );
  });
});
