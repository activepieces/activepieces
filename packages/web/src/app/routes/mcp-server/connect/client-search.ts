import { CatalogClient, ClientGroup } from '../mcp-client-catalog';

function groupMatching({
  groups,
  clients,
  query,
}: {
  groups: ClientGroup[];
  clients: CatalogClient[];
  query: string;
}): ClientGroupMatch[] {
  const needle = query.trim().toLowerCase();
  return groups
    .map((group) => ({
      group,
      clients: clients.filter(
        (client) =>
          client.group === group.key && matchesQuery({ client, needle }),
      ),
    }))
    .filter((match) => match.clients.length > 0);
}

function matchesQuery({
  client,
  needle,
}: {
  client: CatalogClient;
  needle: string;
}): boolean {
  return [client.name, ...client.searchTerms].some((term) =>
    term.toLowerCase().includes(needle),
  );
}

export const clientSearch = { groupMatching };

export type ClientGroupMatch = {
  group: ClientGroup;
  clients: CatalogClient[];
};
