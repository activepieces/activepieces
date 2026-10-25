import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';

import { zohoBooksAuth } from '../../../auth';
import { zohoBooksAiProps } from '../../../common/ai-props';
import { zohoBooksApi } from '../../../common/api';
import { zohoBooksClient } from '../../../common/client';

export const getContactUnusedRetainerPaymentsAction = createAction({
  auth: zohoBooksAuth,
  name: 'zoho_books_get_contact_unused_retainer_payments',
  displayName: 'Get Contact Unused Retainer Payments',
  description: 'Gets the retainer payments of a Zoho Books contact not yet applied to invoices.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists the retainer payments a customer has made that are not yet applied to invoices, optionally for one currency. Needs retainer invoices enabled in Zoho Books. Use Get Contact Unused Credits for other credits.',
    idempotent: true,
  },
  props: {
    organizationId: zohoBooksAiProps.organizationId(),
    contactId: zohoBooksAiProps.contactId({ required: true }),
    currencyId: Property.ShortText({
      displayName: 'Currency ID',
      description: 'Only payments in this currency, e.g. the currency_id from Get Contact.',
      required: false,
    }),
  },
  async run(context) {
    const { contactId, currencyId } = context.propsValue;
    const organizationId = await zohoBooksApi.resolveOrganizationId({
      auth: context.auth,
      organizationId: context.propsValue.organizationId,
    });
    return await zohoBooksClient.request({
      auth: context.auth,
      method: HttpMethod.GET,
      path: `/contacts/${encodeURIComponent(contactId)}/receivables/unusedretainerpayments`,
      query: { organization_id: organizationId, currency_id: currencyId },
    });
  },
});
