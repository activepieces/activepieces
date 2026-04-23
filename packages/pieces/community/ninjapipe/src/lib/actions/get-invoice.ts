import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { ninjapipeAuth } from '../../';
import { ninjapipeApiCall, flattenCustomFields, getAuth } from '../common';

export const getInvoice = createAction({
  auth: ninjapipeAuth,
  name: 'get_invoice',
  displayName: 'Get Invoice',
  description: 'Retrieves an invoice by ID.',
  props: {
    invoiceId: Property.ShortText({ displayName: 'Invoice ID', required: true }),
  },
  async run(context) {
    const auth = getAuth(context);
    const response = await ninjapipeApiCall<Record<string, any>>({ auth, method: HttpMethod.GET, path: `/invoices/${context.propsValue.invoiceId}` });
    return flattenCustomFields(response.body);
  },
});
