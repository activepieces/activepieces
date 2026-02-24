import { createAction, Property } from '@activepieces/pieces-framework';
import { bokioAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const getAnInvoice = createAction({
  auth: bokioAuth,
  name: 'getAnInvoice',
  displayName: 'Get an invoice',
  description: 'Retrieve a specific invoice by its ID',
  props: {
    invoiceId: Property.ShortText({
      displayName: 'Invoice ID',
      description: 'The ID of the invoice to retrieve',
      required: true,
    }),
  },
  async run(context) {
    const { invoiceId } = context.propsValue;
    const { api_key, companyId } = context.auth.props;

    const response = await makeRequest(
      api_key,
      HttpMethod.GET,
      `/companies/${companyId}/invoices/${invoiceId}`
    );

    return response;
  },
});
