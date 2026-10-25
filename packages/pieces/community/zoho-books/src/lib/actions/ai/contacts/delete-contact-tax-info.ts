import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';

import { zohoBooksAuth } from '../../../auth';
import { zohoBooksAiProps } from '../../../common/ai-props';
import { zohoBooksApi } from '../../../common/api';
import { zohoBooksClient } from '../../../common/client';

export const deleteContactTaxInfoAction = createAction({
  auth: zohoBooksAuth,
  name: 'zoho_books_delete_contact_tax_info',
  displayName: 'Delete Contact Tax Info',
  description: 'Deletes a tax registration record of a Zoho Books contact.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Permanently deletes one tax registration record of a contact. It cannot be undone. Tax info IDs come from List Contact Tax Info or Add Contact Tax Info.',
    idempotent: false,
  },
  props: {
    organizationId: zohoBooksAiProps.organizationId(),
    contactId: zohoBooksAiProps.contactId({ required: true }),
    taxInfoId: Property.ShortText({
      displayName: 'Tax Info ID',
      description: 'Tax info ID, from List Contact Tax Info or Add Contact Tax Info.',
      required: true,
    }),
  },
  async run(context) {
    const { contactId, taxInfoId } = context.propsValue;
    const organizationId = await zohoBooksApi.resolveOrganizationId({
      auth: context.auth,
      organizationId: context.propsValue.organizationId,
    });
    return await zohoBooksClient.request({
      auth: context.auth,
      method: HttpMethod.DELETE,
      path: `/contacts/${encodeURIComponent(contactId)}/taxinfo/${encodeURIComponent(taxInfoId)}`,
      query: { organization_id: organizationId },
    });
  },
});
