import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';

import { zohoBooksAuth } from '../../../auth';
import { zohoBooksAiProps } from '../../../common/ai-props';
import { zohoBooksApi } from '../../../common/api';
import { zohoBooksClient } from '../../../common/client';

export const verifyContactAddressAction = createAction({
  auth: zohoBooksAuth,
  name: 'zoho_books_verify_contact_address',
  displayName: 'Verify Contact Address',
  description: 'Verifies a saved address of a Zoho Books contact.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Verifies one saved address of a contact and marks it verified. Address IDs come from List Contact Addresses, List All Contact Addresses or Add Contact Address. To check address fields that are not saved yet, use Validate Address Fields.',
    idempotent: true,
  },
  props: {
    organizationId: zohoBooksAiProps.organizationId(),
    contactId: zohoBooksAiProps.contactId({ required: true }),
    addressId: Property.ShortText({
      displayName: 'Address ID',
      description:
        'Address ID, from List Contact Addresses, List All Contact Addresses or Add Contact Address.',
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
      method: HttpMethod.POST,
      path: `/contacts/${encodeURIComponent(contactId)}/address/${encodeURIComponent(
        addressId,
      )}/verify`,
      query: { organization_id: organizationId },
    });
  },
});
