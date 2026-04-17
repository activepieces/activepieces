import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { readwiseAuth } from '../../index';
import {
  makeReadwiseRequest,
  ReadwisePaginatedResponse,
  ReadwiseHighlight,
} from '../common/client';

interface PollingState {
  lastCheckedAt: string;
}

async function fetchPage(token: string, url: string): Promise<ReadwisePaginatedResponse<ReadwiseHighlight>> {
  const response = await httpClient.sendRequest<ReadwisePaginatedResponse<ReadwiseHighlight>>({
    method: HttpMethod.GET,
    url,
    headers: {
      Authorization: `Token ${token}`,
      'Content-Type': 'application/json',
    },
  });
  return response.body;
}

async function fetchAllSince(token: string, since: string): Promise<ReadwiseHighlight[]> {
  const allHighlights: ReadwiseHighlight[] = [];

  // First page uses the helper (builds URL from base + endpoint)
  let response = await makeReadwiseRequest<ReadwisePaginatedResponse<ReadwiseHighlight>>({
    token,
    method: HttpMethod.GET,
    endpoint: '/highlights/',
    params: {
      page_size: '1000',
      order: 'updated',
      updated__gt: since,
    },
  });

  allHighlights.push(...response.results);

  // Subsequent pages use the full nextUrl from the response directly
  while (response.next) {
    response = await fetchPage(token, response.next);
    allHighlights.push(...response.results);
  }

  return allHighlights;
}

export const newHighlight = createTrigger({
  name: 'new_highlight',
  displayName: 'New Highlight',
  description: 'Fires when a new highlight is saved to Readwise.',
  auth: readwiseAuth,
  props: {},
  type: TriggerStrategy.POLLING,
  async onEnable(context) {
    await context.store.put<PollingState>('readwise_state', {
      lastCheckedAt: new Date().toISOString(),
    });
  },
  async onDisable(context) {
    await context.store.delete('readwise_state');
  },
  async run(context) {
    const token = context.auth.secret_text;
    const state = (await context.store.get<PollingState>('readwise_state')) ?? {
      lastCheckedAt: new Date(0).toISOString(),
    };

    const newHighlights = await fetchAllSince(token, state.lastCheckedAt);

    await context.store.put<PollingState>('readwise_state', {
      lastCheckedAt: new Date().toISOString(),
    });

    return newHighlights;
  },
  async test(context) {
    const token = context.auth.secret_text;
    const response = await makeReadwiseRequest<ReadwisePaginatedResponse<ReadwiseHighlight>>({
      token,
      method: HttpMethod.GET,
      endpoint: '/highlights/',
      params: { page_size: '3', order: '-updated' },
    });
    return response.results;
  },
  sampleData: {
    id: 12345678,
    text: 'The best investment you can make is in yourself.',
    note: '',
    location: 0,
    location_type: 'page',
    color: 'yellow',
    highlighted_at: null,
    created_at: '2026-04-17T00:00:00.000Z',
    updated_at: '2026-04-17T00:00:00.000Z',
    external_id: null,
    end_location: null,
    url: null,
    book_id: 9876543,
    tags: [],
    is_favorite: false,
    is_discard: false,
  },
});
