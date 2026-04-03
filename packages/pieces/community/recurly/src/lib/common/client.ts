import { AppConnectionValueForAuthProperty } from '@activepieces/pieces-framework';
import {
  Account,
  Client,
  Pager,
  Plan,
  Subscription,
} from 'recurly';
import { recurlyAuth } from './auth';
import { FlatRecord, flattenRecord, normalizeRecords } from './utils';

const MAX_DROPDOWN_ITEMS = 100;

export function createRecurlyClient(
  auth: AppConnectionValueForAuthProperty<typeof recurlyAuth>,
): Client {
  return new Client(auth.username);
}

export function getBasicAuthHeader(
  auth: AppConnectionValueForAuthProperty<typeof recurlyAuth>,
): string {
  return `Basic ${Buffer.from(`${auth.username}:`).toString('base64')}`;
}

export async function listAccounts(
  auth: AppConnectionValueForAuthProperty<typeof recurlyAuth>,
): Promise<Account[]> {
  return await collectPagerItems(
    createRecurlyClient(auth).listAccounts({
      params: {
        limit: MAX_DROPDOWN_ITEMS,
      },
    }),
    MAX_DROPDOWN_ITEMS,
  );
}

export async function listPlans(
  auth: AppConnectionValueForAuthProperty<typeof recurlyAuth>,
): Promise<Plan[]> {
  return await collectPagerItems(
    createRecurlyClient(auth).listPlans({
      params: {
        limit: MAX_DROPDOWN_ITEMS,
      },
    }),
    MAX_DROPDOWN_ITEMS,
  );
}

export async function listSubscriptions(
  auth: AppConnectionValueForAuthProperty<typeof recurlyAuth>,
  params: Record<string, string | number>,
  limit: number,
): Promise<Subscription[]> {
  return await collectPagerItems(
    createRecurlyClient(auth).listSubscriptions({
      params,
    }),
    limit,
  );
}

export async function listAccountSubscriptions(
  auth: AppConnectionValueForAuthProperty<typeof recurlyAuth>,
  accountCode: string,
  params: Record<string, string | number>,
  limit: number,
): Promise<Subscription[]> {
  return await collectPagerItems(
    createRecurlyClient(auth).listAccountSubscriptions(
      `code-${accountCode}`,
      {
        params,
      },
    ),
    limit,
  );
}

export function flattenRecurlyResource(value: unknown): FlatRecord {
  return flattenRecord(value);
}

export function flattenRecurlyResourceList(values: unknown[]): FlatRecord[] {
  return normalizeRecords(values.map(flattenRecord));
}

async function collectPagerItems<T>(
  pager: Pager<T>,
  limit: number,
): Promise<T[]> {
  const items: T[] = [];

  for await (const item of pager.each()) {
    items.push(item);

    if (items.length >= limit) {
      break;
    }
  }

  return items;
}
