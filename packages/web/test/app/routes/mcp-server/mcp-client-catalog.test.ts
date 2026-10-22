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

function firstStep(key: string, methodKey: string, isCloud = false) {
  return clientNamed(key, isCloud)?.methods.find(
    (method) => method.key === methodKey,
  )?.instructions[0];
}

function methodKeys(key: string, isCloud: boolean) {
  return clientNamed(key, isCloud)?.methods.map((method) => method.key);
}

describe('mcpClientCatalog methods', () => {
  it('leads Claude and ChatGPT with one click on cloud only', () => {
    expect(methodKeys('claude', true)).toEqual(['directory', 'connector']);
    expect(methodKeys('claude', false)).toEqual(['connector']);
    expect(methodKeys('chatgpt', true)).toEqual(['app', 'connector']);
    expect(methodKeys('chatgpt', false)).toEqual(['connector']);
  });

  it('puts the easiest method first, then the agent prompt, then the config file', () => {
    expect(methodKeys('cursor', false)).toEqual([
      'deeplink',
      'agent',
      'config',
    ]);
    expect(methodKeys('claude-code', false)).toEqual([
      'terminal',
      'agent',
      'config',
    ]);
    expect(methodKeys('gemini-cli', false)).toEqual([
      'terminal',
      'agent',
      'config',
    ]);
  });

  it('gives every coding agent and editor a copyable agent prompt', () => {
    [
      'claude-code',
      'codex',
      'gemini-cli',
      'opencode',
      'cursor',
      'vscode',
      'windsurf',
    ].forEach((key) =>
      expect(firstStep(key, 'agent')?.agentPrompt).toBeTruthy(),
    );
  });

  it('gives chat apps no agent prompt', () => {
    expect(methodKeys('claude', false)).not.toContain('agent');
    expect(methodKeys('unknown', false)).not.toContain('agent');
  });

  it('gives Windsurf a serverUrl config', () => {
    expect(
      JSON.parse(firstStep('windsurf', 'config')?.snippet ?? '{}'),
    ).toEqual({ mcpServers: { activepieces: { serverUrl: SERVER_URL } } });
  });

  it('signs Gemini CLI in with /mcp auth', () => {
    const geminiSignIn = clientNamed('gemini-cli', false)?.methods[0]
      .instructions[1];
    expect(geminiSignIn?.command).toBe('/mcp auth activepieces');
  });

  it('signs Codex in from the terminal', () => {
    const codexSignIn = clientNamed('codex', false)?.methods[0].instructions[1];
    expect(codexSignIn?.command).toBe('codex mcp login activepieces');
  });
});

describe('mcpClientCatalog generated commands', () => {
  it('encodes the server url into the Cursor deep link', () => {
    const href = firstStep('cursor', 'deeplink')?.action?.href ?? '';
    const config = new URL(href).searchParams.get('config') ?? '';
    expect(JSON.parse(atob(config))).toEqual({ url: SERVER_URL });
  });

  it('encodes the server url into the VS Code deep link', () => {
    const href = firstStep('vscode', 'deeplink')?.action?.href ?? '';
    expect(JSON.parse(decodeURIComponent(href.split('?')[1]))).toEqual({
      name: 'activepieces',
      type: 'http',
      url: SERVER_URL,
    });
  });

  it('builds the Claude Code add command', () => {
    expect(firstStep('claude-code', 'terminal')?.command).toBe(
      `claude mcp add --transport http activepieces ${SERVER_URL}`,
    );
  });
});

describe('mcpClientCatalog keys', () => {
  it('lists the same clients as before', () => {
    expect(
      mcpClientCatalog
        .clients({
          serverUrl: SERVER_URL,
          websiteName: 'Activepieces',
          isCloud: false,
        })
        .map((client) => client.key),
    ).toEqual([
      'claude-code',
      'codex',
      'gemini-cli',
      'opencode',
      'windsurf',
      'cursor',
      'vscode',
      'claude',
      'chatgpt',
      'unknown',
    ]);
  });
});
