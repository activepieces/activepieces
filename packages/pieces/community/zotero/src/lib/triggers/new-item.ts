import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { zoteroAuth } from '../../index';
import { makeZoteroRequest, ZoteroItem, ZOTERO_BASE_URL } from '../common/client';

interface ZoteroState {
  lastVersion: number;
}

async function fetchPageDirect(apiKey: string, url: string): Promise<{ items: ZoteroItem[]; nextUrl: string | null }> {
  const response = await httpClient.sendRequest<ZoteroItem[]>({
    method: HttpMethod.GET,
    url,
    headers: {
      'Zotero-API-Key': apiKey,
      'Zotero-API-Version': '3',
    },
  });
  // Zotero uses Link header for pagination
  const linkHeader = (response.headers as Record<string, string>)['link'] ?? '';
  const nextMatch = linkHeader.match(/<([^>]+)>;\s*rel="next"/);
  const nextUrl = nextMatch ? nextMatch[1] : null;
  return { items: response.body, nextUrl };
}

async function fetchAllSince(apiKey: string, userOrGroup: string, libraryId: string, sinceVersion: number): Promise<ZoteroItem[]> {
  const allItems: ZoteroItem[] = [];
  const prefix = userOrGroup === 'user' ? 'users' : 'groups';
  const firstUrl = `${ZOTERO_BASE_URL}/${prefix}/${libraryId}/items?since=${sinceVersion}&sort=dateAdded&direction=desc&limit=100`;

  let { items, nextUrl } = await fetchPageDirect(apiKey, firstUrl);
  allItems.push(...items);

  while (nextUrl) {
    ({ items, nextUrl } = await fetchPageDirect(apiKey, nextUrl));
    allItems.push(...items);
  }

  return allItems;
}

export const newItem = createTrigger({
  name: 'new_item',
  displayName: 'New Item Added',
  description: 'Fires when a new item is added to your Zotero library.',
  auth: zoteroAuth,
  props: {},
  type: TriggerStrategy.POLLING,
  async onEnable(context) {
    const { api_key, user_or_group, library_id } = context.auth.props;
    const items = await makeZoteroRequest<ZoteroItem[]>({
      apiKey: api_key,
      userOrGroup: user_or_group,
      libraryId: library_id,
      method: HttpMethod.GET,
      endpoint: '/items',
      params: { limit: '1', sort: 'dateAdded', direction: 'desc' },
    });
    const version = items[0]?.version ?? 0;
    await context.store.put<ZoteroState>('zotero_state', { lastVersion: version });
  },
  async onDisable(context) {
    await context.store.delete('zotero_state');
  },
  async run(context) {
    const { api_key, user_or_group, library_id } = context.auth.props;
    const state = (await context.store.get<ZoteroState>('zotero_state')) ?? { lastVersion: 0 };

    const newItems = await fetchAllSince(api_key, user_or_group, library_id, state.lastVersion);

    if (newItems.length > 0) {
      const maxVersion = Math.max(...newItems.map((i) => i.version));
      await context.store.put<ZoteroState>('zotero_state', { lastVersion: maxVersion });
    }

    return newItems;
  },
  async test(context) {
    const { api_key, user_or_group, library_id } = context.auth.props;
    return makeZoteroRequest<ZoteroItem[]>({
      apiKey: api_key,
      userOrGroup: user_or_group,
      libraryId: library_id,
      method: HttpMethod.GET,
      endpoint: '/items',
      params: { limit: '3', sort: 'dateAdded', direction: 'desc' },
    });
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
