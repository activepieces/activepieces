import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';

import { simplyprintAuth } from '../auth';
import { simplyprintClient } from '../common/client';
import { Printer } from '../common/types';

export const getPrinterAction = createAction({
  auth: simplyprintAuth,
  name: 'get_printer',
  displayName: 'Get Printer',
  description: 'Get detailed information about a specific printer.',
  props: {
    printerId: Property.Number({
      displayName: 'Printer ID',
      description: 'Numeric printer ID. Typically piped in from an upstream step.',
      required: true,
    }),
  },
  async run(context) {
    const res = await simplyprintClient.simplyprintCall<{ data: Printer[] }>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: 'printers/Get',
      queryParams: { pid: String(context.propsValue.printerId) },
    });
    const data = res.data ?? [];
    return Array.isArray(data) ? (data[0] ?? null) : data;
  },
});
