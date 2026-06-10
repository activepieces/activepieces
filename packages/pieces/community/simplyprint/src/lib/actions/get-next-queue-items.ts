import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';

import { simplyprintAuth } from '../auth';
import { simplyprintClient } from '../common/client';

export const getNextQueueItemsAction = createAction({
  auth: simplyprintAuth,
  name: 'get_next_queue_items',
  displayName: 'Get Next Queue Items',
  description:
    'Resolve the next-up queue items for one or more printers using the company\'s match criteria (with deduplication so the same item is never assigned twice). Returns the matched queue object with item references per printer.',
  props: {
    printerIds: Property.Array({
      displayName: 'Printer IDs',
      description: 'Numeric printer IDs (one or many).',
      required: true,
    }),
    deselectPrinterIds: Property.Array({
      displayName: 'Exclude printer IDs',
      description: 'Optional. Printer IDs to skip when matching (e.g. printers currently busy).',
      required: false,
    }),
  },
  async run(context) {
    const pids = (context.propsValue.printerIds ?? []).map(Number).filter((n) => n > 0);
    if (pids.length === 0) throw new Error('Provide at least one printer ID.');

    // RequirePrinters() is invoked with default GET on this endpoint
    // (see queue/GetNextItems.php), so `pid` lives in queryParams as a
    // CSV. Match-criteria overrides + skip lists are POST.
    const queryParams: Record<string, string> = { pid: pids.join(',') };
    const deselects = (context.propsValue.deselectPrinterIds ?? []).map(Number).filter((n) => n > 0);
    if (deselects.length > 0) queryParams['deselects'] = deselects.join(',');

    return await simplyprintClient.simplyprintCall({
      auth: context.auth,
      method: HttpMethod.POST,
      path: 'queue/GetNextItems',
      queryParams,
      body: {},
    });
  },
});
