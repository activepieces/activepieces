import { HttpMethod } from '@activepieces/pieces-common';
import { tryCatch } from '@activepieces/pieces-framework';
import {
  MastodonApiError,
  MastodonConnection,
  MastodonEntity,
  MastodonQuery,
  mastodonClient,
} from './client';

const POLL_PAGE_LIMIT = 40;
const NUMERIC_ID_PATTERN = /^\d+$/;

async function fetchNewItems({
  auth,
  path,
  query,
  lastItemId,
  operation,
  scope,
}: {
  auth: MastodonConnection;
  path: string;
  query?: MastodonQuery;
  lastItemId: unknown;
  operation: string;
  scope: string;
}): Promise<PolledItem[]> {
  const page = await mastodonClient.requestPage<MastodonEntity>({
    auth,
    method: HttpMethod.GET,
    path,
    operation,
    scope,
    query: {
      ...query,
      limit: POLL_PAGE_LIMIT,
      min_id: typeof lastItemId === 'string' && lastItemId !== '' ? lastItemId : undefined,
    },
  });
  return page.items
    .filter(hasStringId)
    .sort((left, right) => compareIdsDescending({ left: left.id, right: right.id }))
    .map((item) => ({ id: item.id, data: item }));
}

async function resolveAccountId({
  auth,
  account,
  operation,
}: {
  auth: MastodonConnection;
  account: string;
  operation: string;
}): Promise<string> {
  const handle = account.trim().replace(/^@/, '');
  if (handle === '') {
    throw new Error('Enter the account handle (for example Gargron@mastodon.social) or its Account ID.');
  }
  if (NUMERIC_ID_PATTERN.test(handle)) {
    return handle;
  }
  const lookup = await tryCatch(() =>
    mastodonClient.request<MastodonEntity>({
      auth,
      method: HttpMethod.GET,
      path: '/api/v1/accounts/lookup',
      operation,
      scope: 'read:accounts',
      query: { acct: handle },
    })
  );
  if (lookup.error === null) {
    return readAccountId({ account: lookup.data, handle });
  }
  if (!(lookup.error instanceof MastodonApiError) || lookup.error.status !== 404) {
    throw lookup.error;
  }
  const searchResult = await mastodonClient.request<{ accounts?: MastodonEntity[] }>({
    auth,
    method: HttpMethod.GET,
    path: '/api/v2/search',
    operation,
    scope: 'read:search',
    query: { q: handle, type: 'accounts', resolve: true, limit: 5 },
  });
  const match = (searchResult.accounts ?? []).find((candidate) =>
    matchesHandle({ candidate, handle, baseUrl: auth.base_url })
  );
  if (match === undefined) {
    throw new Error(
      `Mastodon found no account for "${handle}". Check the spelling; for an account on another server use the full handle, for example Gargron@mastodon.social.`
    );
  }
  return readAccountId({ account: match, handle });
}

function hasStringId(item: MastodonEntity): item is MastodonEntity & { id: string } {
  return typeof item['id'] === 'string' && item['id'] !== '';
}

function compareIdsDescending({ left, right }: { left: string; right: string }): number {
  if (left.length !== right.length) {
    return right.length - left.length;
  }
  if (left === right) {
    return 0;
  }
  return left < right ? 1 : -1;
}

function readAccountId({ account, handle }: { account: MastodonEntity; handle: string }): string {
  const id = account['id'];
  if (typeof id !== 'string' || id === '') {
    throw new Error(`Mastodon returned no Account ID for "${handle}".`);
  }
  return id;
}

function matchesHandle({
  candidate,
  handle,
  baseUrl,
}: {
  candidate: MastodonEntity;
  handle: string;
  baseUrl: string;
}): boolean {
  const acct = candidate['acct'];
  if (typeof acct !== 'string') {
    return false;
  }
  const wanted = handle.toLowerCase();
  const found = acct.toLowerCase();
  if (found === wanted) {
    return true;
  }
  const host = readHost({ baseUrl });
  return host !== null && `${found}@${host}` === wanted;
}

function readHost({ baseUrl }: { baseUrl: string }): string | null {
  try {
    return new URL(baseUrl).host.toLowerCase();
  } catch {
    return null;
  }
}

export const mastodonPolling = { fetchNewItems, resolveAccountId };

export type PolledItem = {
  id: string;
  data: MastodonEntity;
};
