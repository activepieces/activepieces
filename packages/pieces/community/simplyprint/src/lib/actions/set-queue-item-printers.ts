import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';

import { simplyprintAuth } from '../auth';
import { simplyprintClient } from '../common/client';

export const setQueueItemPrintersAction = createAction({
  auth: simplyprintAuth,
  name: 'set_queue_item_printers',
  displayName: 'Set Queue Item Printer Assignments',
  description:
    'Assign one or more queue items to specific printers, printer models, and/or printer groups. Replaces the current assignments on each item.',
  props: {
    queueItemIds: Property.Array({
      displayName: 'Queue item IDs',
      description: 'Numeric queue item IDs to update.',
      required: true,
    }),
    printerIds: Property.Array({
      displayName: 'Printer IDs',
      description: 'Numeric printer IDs to assign to. Leave empty to clear printer assignments.',
      required: false,
    }),
    modelIds: Property.Array({
      displayName: 'Printer model IDs',
      description: 'Numeric printer model IDs. Leave empty to clear model assignments.',
      required: false,
    }),
    groupIds: Property.Array({
      displayName: 'Printer group IDs',
      description: 'Numeric printer group IDs. Leave empty to clear group assignments.',
      required: false,
    }),
  },
  async run(context) {
    const items = (context.propsValue.queueItemIds ?? []).map(Number).filter((n) => n > 0);
    if (items.length === 0) throw new Error('Provide at least one queue item ID.');

    const body: Record<string, unknown> = { items };
    const printers = (context.propsValue.printerIds ?? []).map(Number).filter((n) => n > 0);
    const models = (context.propsValue.modelIds ?? []).map(Number).filter((n) => n > 0);
    const groups = (context.propsValue.groupIds ?? []).map(Number).filter((n) => n > 0);
    if (printers.length > 0) body['printers'] = printers;
    if (models.length > 0) body['models'] = models;
    if (groups.length > 0) body['groups'] = groups;

    return await simplyprintClient.simplyprintCall({
      auth: context.auth,
      method: HttpMethod.POST,
      path: 'queue/SetQueueItemPrinters',
      body,
    });
  },
});
