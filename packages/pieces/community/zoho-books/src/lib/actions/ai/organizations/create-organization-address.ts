import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';

import { zohoBooksAuth } from '../../../auth';
import { zohoBooksAiProps } from '../../../common/ai-props';
import { zohoBooksApi } from '../../../common/api';
import { zohoBooksClient } from '../../../common/client';

export const createOrganizationAddressAction = createAction({
  auth: zohoBooksAuth,
  name: 'zoho_books_create_organization_address',
  displayName: 'Create Organization Address',
  description: 'Adds an address to a Zoho Books organization.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Adds an address to the organization and returns it with its address_id. Each call adds another address. Needs the admin role in Zoho Books.',
    idempotent: false,
  },
  props: {
    organizationId: zohoBooksAiProps.organizationId(),
    attention: Property.ShortText({
      displayName: 'Attention',
      description: 'Name of the person the address is directed to.',
      required: false,
    }),
    address1: Property.ShortText({ displayName: 'Address Line 1', required: false }),
    address2: Property.ShortText({ displayName: 'Address Line 2', required: false }),
    city: Property.ShortText({ displayName: 'City', required: false }),
    state: Property.ShortText({ displayName: 'State', required: false }),
    stateCode: Property.ShortText({
      displayName: 'State Code',
      description: 'e.g. "NY".',
      required: false,
    }),
    country: Property.ShortText({ displayName: 'Country', required: false }),
    zip: Property.ShortText({ displayName: 'ZIP Code', required: false }),
    phone: Property.ShortText({ displayName: 'Phone', required: false }),
  },
  async run(context) {
    const { attention, address1, address2, city, state, stateCode, country, zip, phone } =
      context.propsValue;
    const organizationId = await zohoBooksApi.resolveOrganizationId({
      auth: context.auth,
      organizationId: context.propsValue.organizationId,
    });
    return await zohoBooksClient.request({
      auth: context.auth,
      method: HttpMethod.POST,
      path: '/organizations/address',
      query: { organization_id: organizationId },
      body: {
        attention,
        address1,
        address2,
        city,
        state,
        state_code: stateCode,
        country,
        zip,
        phone,
      },
    });
  },
});
