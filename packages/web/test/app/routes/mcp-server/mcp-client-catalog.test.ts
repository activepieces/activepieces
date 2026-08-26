import { describe, expect, it, vi } from 'vitest';

vi.mock('i18next', () => ({
  default: { language: 'en-US' },
  t: (key: string) => key,
}));

const { mcpClientCatalog } = await import(
  '@/app/routes/mcp-server/mcp-client-catalog'
);

function clientNamed(key: string, isCloud: boolean) {
  return mcpClientCatalog
    .clients({
      serverUrl: 'https://cloud.activepieces.com/mcp',
      websiteName: 'Activepieces',
      isCloud,
    })
    .find((client) => client.key === key);
}

describe('mcpClientCatalog cloud overrides', () => {
  it('sends Claude to the directory listing on cloud only', () => {
    expect(clientNamed('claude', true)?.steps[0].action?.href).toBe(
      'https://claude.ai/directory/cloud-activepieces-com',
    );
    expect(clientNamed('claude', false)?.steps[0].action?.href).toContain(
      'add-custom-connector',
    );
  });

  it('leaves clients without a cloud override untouched', () => {
    expect(clientNamed('codex', true)).toEqual(clientNamed('codex', false));
  });
});
