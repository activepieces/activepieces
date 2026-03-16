import { httpClient, HttpMethod } from '@activepieces/pieces-common';

const SYNTHETIX_SUBGRAPH =
  'https://api.thegraph.com/subgraphs/name/synthetixio-team/synthetix';

export async function querySynthetix<T = unknown>(
  query: string,
  variables: Record<string, unknown> = {}
): Promise<T> {
  const response = await httpClient.sendRequest<{ data: T; errors?: unknown[] }>({
    method: HttpMethod.POST,
    url: SYNTHETIX_SUBGRAPH,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }),
  });

  if (response.body.errors && response.body.errors.length > 0) {
    throw new Error(
      `Synthetix subgraph error: ${JSON.stringify(response.body.errors)}`
    );
  }

  return response.body.data;
}
