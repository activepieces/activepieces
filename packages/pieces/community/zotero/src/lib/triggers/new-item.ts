import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { zoteroAuth } from '../../index';
import { makeZoteroRequest, ZoteroItem, ZOTERO_BASE_URL } from '../common/client';

export const newItem = createTrigger({
  name: 'new_item',
  displayName: 'New Item Added',
  description: 'Fires when a new item is added to your Zotero library.',
  auth: zoteroAuth,
  props: {},
  type: TriggerStrategy.POLLING,
  async onEnable(context) {
    const { api_key, user_or_group, library_id } = context.auth.props;
    // Seed with the current library version from the response header, not item-level version
    const { lastModifiedVersion } = await makeZoteroRequest<ZoteroItem[]>({
      apiKey: api_key,
      userOrGroup: user_or_group,
      libraryId: library_id,
      method: HttpMethod.GET,
      endpoint: '/items',
      params: { limit: '1', sort: 'dateAdded', direction: 'desc' },
    });
    await context.store.put<ZoteroState>('zotero_state', { lastVersion: lastModifiedVersion });
  },
  async onDisable(context) {
    await context.store.delete('zotero_state');
  },
  async run(context) {
    const { api_key, user_or_group, library_id } = context.auth.props;
    const state = (await context.store.get<ZoteroState>('zotero_state')) ?? { lastVersion: 0 };
    const { items, nextLibraryVersion } = await fetchAllSince({
      apiKey: api_key,
      userOrGroup: user_or_group,
      libraryId: library_id,
      sinceVersion: state.lastVersion,
    });

    await context.store.put<ZoteroState>('zotero_state', { lastVersion: nextLibraryVersion });

    return items;
  },
  async test(context) {
    const { api_key, user_or_group, library_id } = context.auth.props;
    const { body } = await makeZoteroRequest<ZoteroItem[]>({
      apiKey: api_key,
      userOrGroup: user_or_group,
      libraryId: library_id,
      method: HttpMethod.GET,
      endpoint: '/items',
      params: { limit: '3', sort: 'dateAdded', direction: 'desc' },
    });
    return body;
  },
  sampleData: {
    key: 'ABC12345',
    version: 42,
    library: { type: 'user', id: 12345678, name: 'My Library' },
    data: {
      key: 'ABC12345',
      version: 42,
      itemType: 'journalArticle',
      title: 'Sample Research Paper',
      creators: [{ creatorType: 'author', firstName: 'Jane', lastName: 'Smith' }],
      abstractNote: 'Abstract text here.',
      url: 'https://example.com/paper',
      date: '2026',
      language: 'en',
      tags: [{ tag: 'AI' }],
      collections: [],
      dateAdded: '2026-04-17T00:00:00Z',
      dateModified: '2026-04-17T00:00:00Z',
    },
  },
});

interface ZoteroState {
  lastVersion: number;
}

interface FetchAllParams {
  apiKey: string;
  userOrGroup: string;
  libraryId: string;
  sinceVersion: number;
}

interface FetchAllResult {
  items: ZoteroItem[];
  nextLibraryVersion: number;
}

async function fetchPage({ apiKey, url }: { apiKey: string; url: string }): Promise<{ items: ZoteroItem[]; nextUrl: string | null; libraryVersion: number }> {
  const response = await httpClient.sendRequest<ZoteroItem[]>({
    method: HttpMethod.GET,
    url,
    headers: {
      'Zotero-API-Key': apiKey,
      'Zotero-API-Version': '3',
    },
  });
  const headers = response.headers as Record<string, string>;
  const linkHeader = headers['link'] ?? '';
  const nextMatch = linkHeader.match(/<([^>]+)>;\s*rel="next"/);
  const libraryVersion = parseInt(headers['last-modified-version'] ?? '0', 10);
  return { items: response.body, nextUrl: nextMatch ? nextMatch[1] : null, libraryVersion };
}

async function fetchAllSince({ apiKey, userOrGroup, libraryId, sinceVersion }: FetchAllParams): Promise<FetchAllResult> {
  const allItems: ZoteroItem[] = [];
  const prefix = userOrGroup === 'user' ? 'users' : 'groups';
  const firstUrl = `${ZOTERO_BASE_URL}/${prefix}/${libraryId}/items?since=${sinceVersion}&sort=dateAdded&direction=desc&limit=100`;

  let { items, nextUrl, libraryVersion } = await fetchPage({ apiKey, url: firstUrl });
  allItems.push(...items);

  while (nextUrl) {
    ({ items, nextUrl, libraryVersion } = await fetchPage({ apiKey, url: nextUrl }));
    allItems.push(...items);
  }

  return { items: allItems, nextLibraryVersion: libraryVersion };
}
