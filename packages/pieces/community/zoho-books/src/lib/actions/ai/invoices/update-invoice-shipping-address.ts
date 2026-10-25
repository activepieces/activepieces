import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';

import { zohoBooksAuth } from '../../../auth';
import { zohoBooksAiProps } from '../../../common/ai-props';
import { zohoBooksApi } from '../../../common/api';
import { zohoBooksClient } from '../../../common/client';

export const updateInvoiceShippingAddressAction = createAction({
  auth: zohoBooksAuth,
  name: 'zoho_books_update_invoice_shipping_address',
  displayName: 'Update Invoice Shipping Address',
  description: 'Updates the shipping address of one invoice in Zoho Books.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Changes the shipping address printed on one invoice only; the address of the customer stays as it is. Only the fields given are sent.',
    idempotent: true,
  },
  props: {
    organizationId: zohoBooksAiProps.organizationId(),
    invoiceId: zohoBooksAiProps.invoiceId({ required: true }),
    address: Property.LongText({
      displayName: 'Address',
      description: 'Street address, e.g. "4900 Hopyard Rd, Suite 310".',
      required: false,
    }),
    street2: Property.ShortText({
      displayName: 'Street 2',
      description: 'Suite, apartment or floor.',
      required: false,
    }),
    city: Property.ShortText({ displayName: 'City', required: false }),
    state: Property.ShortText({ displayName: 'State', required: false }),
    zip: Property.ShortText({ displayName: 'ZIP Code', required: false }),
    country: Property.ShortText({ displayName: 'Country', required: false }),
    fax: Property.ShortText({ displayName: 'Fax', required: false }),
  },
  async run(context) {
    const { invoiceId, address, street2, city, state, zip, country, fax } = context.propsValue;
    const organizationId = await zohoBooksApi.resolveOrganizationId({
      auth: context.auth,
      organizationId: context.propsValue.organizationId,
    });
    return await zohoBooksClient.request({
      auth: context.auth,
      method: HttpMethod.PUT,
      path: `/invoices/${encodeURIComponent(invoiceId)}/address/shipping`,
      query: { organization_id: organizationId },
      body: { address, street2, city, state, zip, country, fax },
    });
  },
});
