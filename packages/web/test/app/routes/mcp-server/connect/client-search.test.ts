import { describe, expect, it, vi } from 'vitest';

vi.mock('i18next', () => ({
  default: { language: 'en-US' },
  t: (key: string) => key,
}));

const { mcpClientCatalog } = await import(
  '@/app/routes/mcp-server/mcp-client-catalog'
);
const { clientSearch } = await import(
  '@/app/routes/mcp-server/connect/client-search'
);

const clients = mcpClientCatalog.clients({
  serverUrl: 'https://cloud.activepieces.com/mcp',
  websiteName: 'Activepieces',
  isCloud: false,
});
const groups = mcpClientCatalog.groups();

function search(query: string) {
  return clientSearch
    .groupMatching({ groups, clients, query })
    .map((match) => ({
      group: match.group.key,
      clients: match.clients.map((client) => client.name),
    }));
}

describe('clientSearch.groupMatching', () => {
  it('matches case-insensitively and drops groups with no match', () => {
    expect(search(' CURSOR ')).toEqual([
      { group: 'editors', clients: ['Cursor'] },
    ]);
  });

  it('finds Devin by its old name, Windsurf', () => {
    expect(search('windsurf')).toEqual([
      { group: 'editors', clients: ['Devin'] },
    ]);
  });
});
