import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';

import { zohoBooksAuth } from '../../../auth';
import { zohoBooksAiProps } from '../../../common/ai-props';
import { zohoBooksApi } from '../../../common/api';
import { zohoBooksClient } from '../../../common/client';

export const deleteContactAddressAction = createAction({
  auth: zohoBooksAuth,
  name: 'zoho_books_delete_contact_address',
  displayName: 'Delete Contact Address',
  description: 'Deletes an additional address of a Zoho Books contact.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description: 'Permanently deletes an additional address of a contact. It cannot be undone.',
    idempotent: false,
  },
  props: {
    organizationId: zohoBooksAiProps.organizationId(),
    contactId: zohoBooksAiProps.contactId({ required: true }),
    addressId: Property.ShortText({
      displayName: 'Address ID',
      description: 'Address ID, from List Contact Addresses or Add Contact Address.',
      required: true,
    }),
  },
  async run(context) {
    const { contactId, addressId } = context.propsValue;
    const organizationId = await zohoBooksApi.resolveOrganizationId({
      auth: context.auth,
      organizationId: context.propsValue.organizationId,
    });
    return await zohoBooksClient.request({
      auth: context.auth,
      method: HttpMethod.DELETE,
      path: `/contacts/${encodeURIComponent(contactId)}/address/${encodeURIComponent(addressId)}`,
      query: { organization_id: organizationId },
    });
  },
});
