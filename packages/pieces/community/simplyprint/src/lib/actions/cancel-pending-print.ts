import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';

import { simplyprintAuth } from '../auth';
import { simplyprintClient } from '../common/client';

export const cancelPendingPrintAction = createAction({
  auth: simplyprintAuth,
  name: 'cancel_pending_print',
  displayName: 'Cancel Pending Print',
  description:
    'Cancel a print that\'s queued/staged on a printer but hasn\'t started yet (status = print_pending). Distinct from "Cancel Print", which targets the active print.',
  audience: 'both',
  aiMetadata: {
    description:
      'Cancels prints that are staged/queued on one or more printers but have not started yet (status print_pending), given numeric printer IDs. Pick this for not-yet-running prints; use the separate "Cancel Print" action for the currently active print. Idempotent: once a printer has no pending print the call converges to the same state.',
    idempotent: true,
  },
  props: {
    printerIds: Property.Array({
      displayName: 'Printer IDs',
      description: 'Numeric printer IDs whose pending prints should be cancelled.',
      required: true,
    }),
  },
  async run(context) {
    const pids = (context.propsValue.printerIds ?? []).map(Number).filter((n) => n > 0);
    if (pids.length === 0) throw new Error('Provide at least one printer ID.');

    return await simplyprintClient.simplyprintCall({
      auth: context.auth,
      method: HttpMethod.POST,
      path: 'printers/actions/CancelPendingPrint',
      queryParams: { pid: pids.join(',') },
    });
  },
});
