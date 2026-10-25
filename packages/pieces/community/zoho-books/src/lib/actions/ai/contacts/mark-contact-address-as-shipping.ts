import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';

import { zohoBooksAuth } from '../../../auth';
import { zohoBooksAiProps } from '../../../common/ai-props';
import { zohoBooksApi } from '../../../common/api';
import { zohoBooksClient } from '../../../common/client';

export const markContactAddressAsShippingAction = createAction({
  auth: zohoBooksAuth,
  name: 'zoho_books_mark_contact_address_as_shipping',
  displayName: 'Mark Contact Address As Shipping',
  description: 'Makes an address the shipping address of a Zoho Books contact.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Makes one of the contact addresses its shipping address. Address IDs come from List Contact Addresses, List All Contact Addresses or Add Contact Address.',
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
      )}/markasshipping`,
      query: { organization_id: organizationId },
    });
  },
});
