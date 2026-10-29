import { HttpMethod } from '@activepieces/pieces-common';
import { NinjaPipeAuth, NinjaPipeRecord, ninjapipeClient } from './client';

async function findContactByEmail({ auth, email }: { auth: NinjaPipeAuth; email: string }): Promise<NinjaPipeRecord | undefined> {
  const wanted = email.trim().toLowerCase();
  for (let page = 1; page <= EMAIL_LOOKUP_MAX_PAGES; page++) {
    const result = await ninjapipeClient.listPage({
      auth,
      path: '/contacts',
      query: { search: email.trim() },
      page,
      limit: 100,
      operation: 'contact lookup by email',
    });
    const match = result.items.find((item) => typeof item['email'] === 'string' && item['email'].trim().toLowerCase() === wanted);
    if (match) return match;
    if (!result.hasMore) return undefined;
  }
  return undefined;
}

async function findCompanyByField({
  auth,
  field,
  value,
}: {
  auth: NinjaPipeAuth;
  field: string;
  value: string;
}): Promise<NinjaPipeRecord | undefined> {
  const wanted = value.trim().toLowerCase();
  for (let page = 1; page <= EMAIL_LOOKUP_MAX_PAGES; page++) {
    const result = await ninjapipeClient.listPage({
      auth,
      path: '/companies',
      query: { search: value.trim() },
      page,
      limit: 100,
      operation: 'company lookup',
    });
    const match = result.items.find((item) => typeof item[field] === 'string' && item[field].trim().toLowerCase() === wanted);
    if (match) return match;
    if (!result.hasMore) return undefined;
  }
  return undefined;
}

async function listWorkspaceMembers({ auth }: { auth: NinjaPipeAuth }): Promise<{ items: NinjaPipeRecord[]; count: number }> {
  const body = await ninjapipeClient.ninjapipeRequest({
    auth,
    method: HttpMethod.GET,
    path: '/workspace/members',
    operation: 'list workspace members',
  });
  const items = ninjapipeClient.readItems(body);
  return { items, count: items.length };
}

async function listUnpaged({
  auth,
  path,
  query,
  operation,
}: {
  auth: NinjaPipeAuth;
  path: string;
  query?: Record<string, unknown>;
  operation: string;
}): Promise<{ items: NinjaPipeRecord[]; count: number }> {
  const body = await ninjapipeClient.ninjapipeRequest({ auth, method: HttpMethod.GET, path, query, operation });
  const items = ninjapipeClient.readItems(body);
  return { items, count: items.length };
}

const EMAIL_LOOKUP_MAX_PAGES = 10;

export const ninjapipeRecords = { findContactByEmail, findCompanyByField, listWorkspaceMembers, listUnpaged };
