import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';

import { simplyprintAuth } from '../auth';
import { simplyprintClient } from '../common/client';

export const getNextQueueItemsForPrintersAction = createAction({
  auth: simplyprintAuth,
  name: 'get_next_queue_items_for_printers',
  displayName: 'Preview Next Queue Items per Printer',
  description:
    'Read-only preview of the next-up queue item for each given printer (no dedup, no offline checks). For each printer, returns either the matched queue item or the issues blocking a match. Different from "Get Next Queue Items": that one dedupes for actual scheduling, this one shows what each printer would pick.',
  props: {
    printerIds: Property.Array({
      displayName: 'Printer IDs',
      description: 'Numeric printer IDs (one or many).',
      required: true,
    }),
  },
  async run(context) {
    const pids = (context.propsValue.printerIds ?? []).map(Number).filter((n) => n > 0);
    if (pids.length === 0) throw new Error('Provide at least one printer ID.');

    // GetNextItemsForPrinters' RequirePrinters accepts pid from either
    // POST or GET; we use POST since the call is otherwise empty.
    return await simplyprintClient.simplyprintCall({
      auth: context.auth,
      method: HttpMethod.POST,
      path: 'queue/GetNextItemsForPrinters',
      body: { pid: pids.join(',') },
    });
  },
});
