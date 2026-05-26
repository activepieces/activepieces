import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';

import { simplyprintAuth } from '../auth';
import { simplyprintClient } from '../common/client';

export const getPrinterNotificationsAction = createAction({
  auth: simplyprintAuth,
  name: 'get_printer_notifications',
  displayName: 'Get Printer Notifications',
  description:
    'Fetch the open notifications/events on one or more printers. Pairs well with the `requires_attention` bucket from "Get Farm Overview".',
  props: {
    printerIds: Property.Array({
      displayName: 'Printer IDs',
      description: 'Numeric printer IDs to query.',
      required: true,
    }),
  },
  async run(context) {
    const pids = (context.propsValue.printerIds ?? []).map(Number).filter((n) => n > 0);
    if (pids.length === 0) throw new Error('Provide at least one printer ID.');

    // RequirePrinters() with default GET reads `pid` from query string.
    return await simplyprintClient.simplyprintCall({
      auth: context.auth,
      method: HttpMethod.GET,
      path: 'printers/notification/Get',
      queryParams: { pid: pids.join(',') },
    });
  },
});
