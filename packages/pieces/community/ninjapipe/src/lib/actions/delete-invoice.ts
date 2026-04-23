import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { ninjapipeAuth } from '../../';
import { ninjapipeApiCall, getAuth } from '../common';

export const deleteInvoice = createAction({
  auth: ninjapipeAuth,
  name: 'delete_invoice',
  displayName: 'Delete Invoice',
  description: 'Deletes an invoice by ID.',
  props: {
    invoiceId: Property.ShortText({ displayName: 'Invoice ID', required: true }),
  },
  async run(context) {
    const auth = getAuth(context);
    await ninjapipeApiCall<Record<string, any>>({ auth, method: HttpMethod.DELETE, path: `/invoices/${context.propsValue.invoiceId}` });
    return { success: true, deleted_id: context.propsValue.invoiceId };
  },
});
