import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';

import { zohoBooksAuth } from '../../../auth';
import { zohoBooksAiProps } from '../../../common/ai-props';
import { zohoBooksApi } from '../../../common/api';
import { zohoBooksClient } from '../../../common/client';

export const listContactAddressesAction = createAction({
  auth: zohoBooksAuth,
  name: 'zoho_books_list_contact_addresses',
  displayName: 'List Contact Addresses',
  description: 'Lists the billing, shipping and additional addresses of a Zoho Books contact.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists the billing, shipping and additional addresses of one contact with their address_id, which Update Contact Address and Delete Contact Address take. Use List All Contact Addresses for every contact.',
    idempotent: true,
  },
  props: {
    organizationId: zohoBooksAiProps.organizationId(),
    contactId: zohoBooksAiProps.contactId({ required: true }),
  },
  async run(context) {
    const organizationId = await zohoBooksApi.resolveOrganizationId({
      auth: context.auth,
      organizationId: context.propsValue.organizationId,
    });
    return await zohoBooksClient.request({
      auth: context.auth,
      method: HttpMethod.GET,
      path: `/contacts/${encodeURIComponent(context.propsValue.contactId)}/address`,
      query: { organization_id: organizationId },
    });
  },
});
