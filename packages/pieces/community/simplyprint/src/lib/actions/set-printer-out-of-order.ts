import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';

import { simplyprintAuth } from '../auth';
import { simplyprintClient } from '../common/client';

export const setPrinterOutOfOrderAction = createAction({
  auth: simplyprintAuth,
  name: 'set_printer_out_of_order',
  displayName: 'Set Printer Out of Order',
  description: 'Mark one or more printers as out-of-order (or clear that flag). Requires the Out-of-Order feature on the account.',
  props: {
    printerIds: Property.Array({
      displayName: 'Printer IDs',
      description: 'Numeric printer IDs.',
      required: true,
    }),
    outOfOrder: Property.Checkbox({
      displayName: 'Out of order?',
      description: 'True = mark as out-of-order. False = clear the flag.',
      required: true,
      defaultValue: true,
    }),
  },
  async run(context) {
    const pids = (context.propsValue.printerIds ?? []).map(Number).filter((n) => n > 0);
    if (pids.length === 0) throw new Error('Provide at least one printer ID.');

    return await simplyprintClient.simplyprintCall({
      auth: context.auth,
      method: HttpMethod.POST,
      path: 'printers/SetOutOfOrder',
      queryParams: { pid: pids.join(',') },
      body: { on: context.propsValue.outOfOrder ?? true },
    });
  },
});
