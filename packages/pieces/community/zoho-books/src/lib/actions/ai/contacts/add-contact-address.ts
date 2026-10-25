import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';

import { zohoBooksAuth } from '../../../auth';
import { zohoBooksAiProps } from '../../../common/ai-props';
import { zohoBooksApi } from '../../../common/api';
import { zohoBooksClient } from '../../../common/client';

export const addContactAddressAction = createAction({
  auth: zohoBooksAuth,
  name: 'zoho_books_add_contact_address',
  displayName: 'Add Contact Address',
  description: 'Adds an additional address to a Zoho Books contact.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Adds an additional address to a contact and returns its address_id. Each call adds a new address, so check List Contact Addresses first; use Update Contact to change the billing or shipping address.',
    idempotent: false,
  },
  props: {
    organizationId: zohoBooksAiProps.organizationId(),
    contactId: zohoBooksAiProps.contactId({ required: true }),
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
    const { contactId, attention, address, street2, city, state, zip, country, fax, phone } =
      context.propsValue;
    const organizationId = await zohoBooksApi.resolveOrganizationId({
      auth: context.auth,
      organizationId: context.propsValue.organizationId,
    });
    return await zohoBooksClient.request({
      auth: context.auth,
      method: HttpMethod.POST,
      path: `/contacts/${encodeURIComponent(contactId)}/address`,
      query: { organization_id: organizationId },
      body: { attention, address, street2, city, state, zip, country, fax, phone },
    });
  },
});
