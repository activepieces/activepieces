import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';

import { simplyprintAuth } from '../auth';
import { simplyprintClient } from '../common/client';
import { QueueItem } from '../common/types';

export const listPendingQueueItemsAction = createAction({
  auth: simplyprintAuth,
  name: 'list_pending_queue_items',
  displayName: 'List Pending Queue Items',
  description: 'List queue items awaiting approval, denied, or sent back for revision.',
  audience: 'both',
  aiMetadata: {
    description:
      'Read-only, paginated listing of queue items in the approval workflow — pending, denied, or sent back for revision. Pick this to review submissions needing a moderation decision; filter to a single approval status or list all three. Use the general queue listing instead for items already in the active print queue.',
    idempotent: true,
  },
  props: {
    status: Property.StaticDropdown<'all' | 'pending' | 'denied' | 'revision'>({
      displayName: 'Status filter',
      description: 'Restrict to a single approval status. Defaults to all (pending + denied + revision).',
      required: false,
      defaultValue: 'all',
      options: {
        options: [
          { label: 'All (pending + denied + revision)', value: 'all' },
          { label: 'Pending', value: 'pending' },
          { label: 'Denied', value: 'denied' },
          { label: 'Revision', value: 'revision' },
        ],
      },
    }),
    page: Property.Number({
      displayName: 'Page (optional)',
      description: 'Page number (1-based). Defaults to 1.',
      required: false,
    }),
    perPage: Property.Number({
      displayName: 'Per page (optional)',
      description: 'Items per page (max 100). Defaults to 50 (backend default).',
      required: false,
    }),
  },
  async run(context) {
    // queue/approval/GetPendingItems returns `{items, total, page, per_page}`
    // — note the field name `items`, NOT `data`. Filters live on $this->GET.
    const queryParams: Record<string, string> = {};
    if (context.propsValue.status && context.propsValue.status !== 'all') {
      queryParams['status'] = context.propsValue.status;
    }
    if (typeof context.propsValue.page === 'number' && context.propsValue.page >= 1) {
      queryParams['page'] = String(Math.floor(context.propsValue.page));
    }
    if (typeof context.propsValue.perPage === 'number' && context.propsValue.perPage > 0) {
      queryParams['per_page'] = String(Math.min(100, Math.floor(context.propsValue.perPage)));
    }

    const res = await simplyprintClient.simplyprintCall<{ items: QueueItem[] }>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: 'queue/approval/GetPendingItems',
      queryParams,
    });
    return (res.items ?? []) as QueueItem[];
  },
});
