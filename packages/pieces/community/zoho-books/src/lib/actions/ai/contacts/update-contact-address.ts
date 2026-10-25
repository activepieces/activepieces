import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';

import { zohoBooksAuth } from '../../../auth';
import { zohoBooksAiProps } from '../../../common/ai-props';
import { zohoBooksApi } from '../../../common/api';
import { zohoBooksClient } from '../../../common/client';

export const updateContactAddressAction = createAction({
  auth: zohoBooksAuth,
  name: 'zoho_books_update_contact_address',
  displayName: 'Update Contact Address',
  description: 'Updates an additional address of a Zoho Books contact.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Updates an additional address of a contact; only the fields given are sent. Use Update Contact to change the billing or shipping address.',
    idempotent: true,
  },
  props: {
    organizationId: zohoBooksAiProps.organizationId(),
    contactId: zohoBooksAiProps.contactId({ required: true }),
    addressId: Property.ShortText({
      displayName: 'Address ID',
      description: 'Address ID, from List Contact Addresses or Add Contact Address.',
      required: true,
    }),
    attention: Property.ShortText({
      displayName: 'Attention',
      description: 'Name of the person the address is directed to, e.g. "Mr. John".',
      required: false,
    }),
    address: Property.ShortText({
      displayName: 'Street',
      description: 'e.g. "4900 Hopyard Rd".',
      required: false,
    }),
    street2: Property.ShortText({
      displayName: 'Street 2',
      description: 'e.g. "Suite 310".',
      required: false,
    }),
    city: Property.ShortText({ displayName: 'City', required: false }),
    state: Property.ShortText({ displayName: 'State', required: false }),
    zip: Property.ShortText({ displayName: 'ZIP Code', required: false }),
    country: Property.ShortText({ displayName: 'Country', required: false }),
    fax: Property.ShortText({ displayName: 'Fax', required: false }),
    phone: Property.ShortText({ displayName: 'Phone', required: false }),
  },
  async run(context) {
    const {
      contactId,
      addressId,
      attention,
      address,
      street2,
      city,
      state,
      zip,
      country,
      fax,
      phone,
    } = context.propsValue;
    const organizationId = await zohoBooksApi.resolveOrganizationId({
      auth: context.auth,
      organizationId: context.propsValue.organizationId,
    });
    return await zohoBooksClient.request({
      auth: context.auth,
      method: HttpMethod.PUT,
      path: `/contacts/${encodeURIComponent(contactId)}/address/${encodeURIComponent(addressId)}`,
      query: { organization_id: organizationId },
      body: {
        address_id: addressId,
        attention,
        address,
        street2,
        city,
        state,
        zip,
        country,
        fax,
        phone,
      },
    });
  },
});
