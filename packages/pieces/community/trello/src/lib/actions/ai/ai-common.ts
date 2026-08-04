import { QueryParams } from '@activepieces/pieces-common';

/**
 * Shared helpers for the audience:'ai' Trello atomics. Trello auth is the
 * BasicAuth API key + token passed as ?key=&token= query params (auth.username
 * = API key, auth.password = token) — the same pattern every existing action
 * uses. These helpers keep the agent atomics DRY without changing that pattern.
 */

export type TrelloAuthValue = { username: string; password: string };

/** Build the ?key=&token= auth query-param suffix the Trello REST API expects. */
export function authQuery(auth: TrelloAuthValue): string {
  return `?key=${auth.username}&token=${auth.password}`;
}

/** Auth params merged into a QueryParams object (for requests that pass queryParams). */
export function withAuthParams(
  auth: TrelloAuthValue,
  params: QueryParams = {}
): QueryParams {
  return { ...params, key: auth.username, token: auth.password };
}

/** Map a Trello HTTP error to a clear, per-status message; rethrow otherwise. */
export function rethrowTrelloError(error: any, notFoundHint: string): never {
  const status = error?.response?.status;
  if (status === 401 || status === 403) {
    throw new Error(
      'Permission denied. Check the connection token and that the connected user has the required access (some board/organization actions require admin permission).'
    );
  }
  if (status === 404) {
    throw new Error(notFoundHint);
  }
  if (status === 429) {
    throw new Error('Trello rate limit exceeded. Retry after a short delay.');
  }
  throw error;
}
