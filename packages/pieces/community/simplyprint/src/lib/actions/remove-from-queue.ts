import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';

import { simplyprintAuth } from '../auth';
import { simplyprintClient } from '../common/client';

export const removeFromQueueAction = createAction({
  auth: simplyprintAuth,
  name: 'remove_from_queue',
  displayName: 'Remove Queue Item',
  description: 'Remove an item from the print queue. Destructive — the item is gone.',
  audience: 'both',
  aiMetadata: {
    description:
      'Permanently delete a single item from the print queue by its numeric ID. This is destructive — the item is gone (use Archive Print Jobs for completed jobs you only want out of the active view). Deleting an already-removed item simply finds nothing to delete, so the end state is idempotent.',
    idempotent: true,
  },
  props: {
    queueItemId: Property.Number({
      displayName: 'Queue item ID',
      description: 'Numeric queue item ID. Typically piped in from an upstream step.',
      required: true,
    }),
  },
  async run(context) {
    // queue/DeleteItem reads `job` / `jobs` from $this->GET only — sending
    // them in the JSON body fails the get_validation rule
    // (`required_without:jobs`).
    return await simplyprintClient.simplyprintCall({
      auth: context.auth,
      method: HttpMethod.POST,
      path: 'queue/DeleteItem',
      queryParams: { job: String(context.propsValue.queueItemId) },
    });
  },
});
