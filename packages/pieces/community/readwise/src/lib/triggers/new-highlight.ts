import {
  createTrigger,
  TriggerStrategy,
  PiecePropValueSchema,
} from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { readwiseAuth } from '../../index';
import {
  makeReadwiseRequest,
  ReadwisePaginatedResponse,
  ReadwiseHighlight,
} from '../common/client';

interface PollingState {
  lastHighlightId: number;
  lastCheckedAt: string;
}

export const newHighlight = createTrigger({
  name: 'new_highlight',
  displayName: 'New Highlight',
  description: 'Fires when a new highlight is saved to Readwise.',
  auth: readwiseAuth,
  props: {},
  type: TriggerStrategy.POLLING,
  async onEnable(context) {
    const token = context.auth as string;
    const response = await makeReadwiseRequest<ReadwisePaginatedResponse<ReadwiseHighlight>>(
      token,
      HttpMethod.GET,
      '/highlights/',
      undefined,
      { page_size: '1', order: '-updated' }
    );
    const latestId = response.results[0]?.id ?? 0;
    await context.store.put<PollingState>('readwise_state', {
      lastHighlightId: latestId,
      lastCheckedAt: new Date().toISOString(),
    });
  },
  async onDisable(context) {
    await context.store.delete('readwise_state');
  },
  async run(context) {
    const token = context.auth as string;
    const state = await context.store.get<PollingState>('readwise_state') ?? {
      lastHighlightId: 0,
      lastCheckedAt: new Date(0).toISOString(),
    };

    const response = await makeReadwiseRequest<ReadwisePaginatedResponse<ReadwiseHighlight>>(
      token,
      HttpMethod.GET,
      '/highlights/',
      undefined,
      {
        page_size: '50',
        order: '-updated',
        updated__gt: state.lastCheckedAt,
      }
    );

    const newHighlights = response.results.filter(
      (h) => h.id > state.lastHighlightId
    );

    if (newHighlights.length > 0) {
      await context.store.put<PollingState>('readwise_state', {
        lastHighlightId: Math.max(...newHighlights.map((h) => h.id)),
        lastCheckedAt: new Date().toISOString(),
      });
    }

    return newHighlights;
  },
  async test(context) {
    const token = context.auth as string;
    const response = await makeReadwiseRequest<ReadwisePaginatedResponse<ReadwiseHighlight>>(
      token,
      HttpMethod.GET,
      '/highlights/',
      undefined,
      { page_size: '3', order: '-updated' }
    );
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
