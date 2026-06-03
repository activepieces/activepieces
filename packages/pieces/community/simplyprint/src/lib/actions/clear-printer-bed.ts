import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';

import { simplyprintAuth } from '../auth';
import { simplyprintClient } from '../common/client';

export const clearPrinterBedAction = createAction({
  auth: simplyprintAuth,
  name: 'clear_printer_bed',
  displayName: 'Clear Printer Bed',
  description:
    'Mark a printer\'s bed as cleared after a print finishes. Bread-and-butter step in AutoPrint flows — pair with a "print done" trigger to automate bed clearing.',
  props: {
    printerIds: Property.Array({
      displayName: 'Printer IDs',
      description: 'Numeric printer IDs to clear.',
      required: true,
    }),
    success: Property.Checkbox({
      displayName: 'Cleared successfully?',
      description: 'Was the bed actually cleared (true) or did it fail (false)? Drives AutoPrint clear-count logic.',
      required: false,
      defaultValue: true,
    }),
    rating: Property.StaticDropdown<1 | 2 | 3 | 4>({
      displayName: 'Print rating (optional)',
      description: 'Optional 1-4 star rating for the just-finished print.',
      required: false,
      options: {
        options: [
          { label: '1 star', value: 1 },
          { label: '2 stars', value: 2 },
          { label: '3 stars', value: 3 },
          { label: '4 stars', value: 4 },
        ],
      },
    }),
    autoPrintResetClearCount: Property.Checkbox({
      displayName: 'Reset AutoPrint clear count',
      description: 'When checked, resets the AutoPrint cleared-bed counter on the printer.',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const pids = (context.propsValue.printerIds ?? []).map(Number).filter((n) => n > 0);
    if (pids.length === 0) throw new Error('Provide at least one printer ID.');

    const body: Record<string, unknown> = {};
    if (typeof context.propsValue.success === 'boolean') body['success'] = context.propsValue.success;
    if (typeof context.propsValue.rating === 'number') body['rating'] = context.propsValue.rating;
    if (typeof context.propsValue.autoPrintResetClearCount === 'boolean') {
      body['autoPrintResetClearCount'] = context.propsValue.autoPrintResetClearCount;
    }

    return await simplyprintClient.simplyprintCall({
      auth: context.auth,
      method: HttpMethod.POST,
      path: 'printers/actions/ClearBed',
      queryParams: { pid: pids.join(',') },
      body,
    });
  },
});
