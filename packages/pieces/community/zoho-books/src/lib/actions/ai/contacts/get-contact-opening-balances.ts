import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';

import { zohoBooksAuth } from '../../../auth';
import { zohoBooksAiProps } from '../../../common/ai-props';
import { zohoBooksApi } from '../../../common/api';
import { zohoBooksClient } from '../../../common/client';
import { zohoBooksGetContactOpeningBalancesOutputSchema } from '../../../output-schemas';

export const getContactOpeningBalancesAction = createAction({
  auth: zohoBooksAuth,
  name: 'zoho_books_get_contact_opening_balances',
  outputSchema: zohoBooksGetContactOpeningBalancesOutputSchema,
  displayName: 'Get Contact Opening Balances',
  description: 'Gets the opening balances of a Zoho Books contact.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Gets the opening balances recorded for a contact, such as the receivable or payable balance it started with.',
    idempotent: true,
  },
  props: {
    organizationId: zohoBooksAiProps.organizationId(),
    contactId: zohoBooksAiProps.contactId({ required: true }),
    contactType: Property.StaticDropdown({
      displayName: 'Contact Type',
      description: 'Whether the contact is a customer or a vendor, from the contact_type of Get Contact.',
      required: true,
      options: {
        options: [
          { label: 'Customer', value: 'customer' },
          { label: 'Vendor', value: 'vendor' },
        ],
      },
    }),
  },
  async run(context) {
    const organizationId = await zohoBooksApi.resolveOrganizationId({
      auth: context.auth,
      organizationId: context.propsValue.organizationId,
    });
    return await zohoBooksClient.request({
      auth: context.auth,
      method: HttpMethod.GET,
      path: `/contacts/${encodeURIComponent(context.propsValue.contactId)}/openingbalances`,
      query: { organization_id: organizationId, contact_type: context.propsValue.contactType },
    });
  },
});
