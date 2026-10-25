import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';

import { zohoBooksAuth } from '../../../auth';
import { zohoBooksAiProps } from '../../../common/ai-props';
import { zohoBooksApi } from '../../../common/api';
import { zohoBooksClient } from '../../../common/client';

export const validateAddressFieldsAction = createAction({
  auth: zohoBooksAuth,
  name: 'zoho_books_validate_address_fields',
  displayName: 'Validate Address Fields',
  description: 'Checks whether an address is valid before it is saved on a Zoho Books contact.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Validates an address from its fields before it is used in Create Contact, Update Contact or Add Contact Address. Nothing is saved.',
    idempotent: true,
  },
  props: {
    organizationId: zohoBooksAiProps.organizationId(),
    line1: Property.ShortText({
      displayName: 'Address Line 1',
      description: 'First line of the address, up to 60 characters, e.g. "4900 Hopyard Rd".',
      required: true,
    }),
    city: Property.ShortText({ displayName: 'City', required: false }),
    region: Property.ShortText({
      displayName: 'Region',
      description: 'State or region, e.g. "CA".',
      required: false,
    }),
    country: Property.ShortText({ displayName: 'Country', required: false }),
    postalCode: Property.ShortText({ displayName: 'Postal Code', required: false }),
  },
  async run(context) {
    const { line1, city, region, country, postalCode } = context.propsValue;
    const organizationId = await zohoBooksApi.resolveOrganizationId({
      auth: context.auth,
      organizationId: context.propsValue.organizationId,
    });
    return await zohoBooksClient.request({
      auth: context.auth,
      method: HttpMethod.GET,
      path: '/contacts/address/verify',
      query: {
        organization_id: organizationId,
        line1,
        city,
        region,
        country,
        postal_code: postalCode,
      },
    });
  },
});
