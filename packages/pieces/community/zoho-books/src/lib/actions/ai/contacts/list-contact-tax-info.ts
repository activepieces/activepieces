import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';

import { zohoBooksAuth } from '../../../auth';
import { zohoBooksAiProps } from '../../../common/ai-props';
import { zohoBooksApi } from '../../../common/api';
import { zohoBooksClient } from '../../../common/client';

export const listContactTaxInfoAction = createAction({
  auth: zohoBooksAuth,
  name: 'zoho_books_list_contact_tax_info',
  displayName: 'List Contact Tax Info',
  description: 'Lists the tax registration records of a Zoho Books contact.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists the tax registration records of a contact with their tax_info_id, which Update Contact Tax Info and Delete Contact Tax Info take. Which tax registrations exist depends on the organization edition (country).',
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
      path: `/contacts/${encodeURIComponent(context.propsValue.contactId)}/taxinfo`,
      query: { organization_id: organizationId },
    });
  },
});
