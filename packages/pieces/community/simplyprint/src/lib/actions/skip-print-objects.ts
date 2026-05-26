import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';

import { simplyprintAuth } from '../auth';
import { simplyprintClient } from '../common/client';

export const skipPrintObjectsAction = createAction({
  auth: simplyprintAuth,
  name: 'skip_print_objects',
  displayName: 'Skip Print Objects',
  description:
    'Skip one or more individual model objects on the current print (printer must be in PRINTING / PAUSED / PAUSING / CANCELLING / RESUMING state). Single printer per call.',
  props: {
    printerId: Property.Number({
      displayName: 'Printer ID',
      description: 'Numeric printer ID of the active print.',
      required: true,
    }),
    objectIds: Property.Array({
      displayName: 'Object indices',
      description: 'Numeric indices of the objects to skip (as exposed by the slicer / printer\'s object list).',
      required: true,
    }),
  },
  async run(context) {
    const objectIds = (context.propsValue.objectIds ?? []).map(Number).filter((n) => Number.isFinite(n));
    if (objectIds.length === 0) throw new Error('Provide at least one object ID to skip.');

    return await simplyprintClient.simplyprintCall({
      auth: context.auth,
      method: HttpMethod.POST,
      path: 'printers/actions/SkipObjects',
      queryParams: { pid: String(context.propsValue.printerId) },
      body: { object_ids: objectIds },
    });
  },
});
