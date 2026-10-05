import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { resendAuth } from '../..';
import { resendClient } from '../common/client';
import { resendProps } from '../common/props';
import { getContactPropertyOutputSchema } from '../output-schemas';

export const getContactProperty = createAction({
  name: 'get_contact_property',
  classification: 'READ',
  auth: resendAuth,
  displayName: 'Get Contact Property',
  outputSchema: getContactPropertyOutputSchema,
  description: 'Retrieve a single custom contact field by ID',
  audience: 'ai',
  aiMetadata: { description: 'Retrieves the definition (key, type, fallback value) of a single custom contact property by its ID. Use List Contact Properties to find the ID. Read-only and idempotent.', idempotent: true },
  props: {
    contact_property_id: resendProps.contactPropertyId,
  },
  async run({ auth, propsValue }) {
    return await resendClient.sendRequest({ auth: auth.secret_text, method: HttpMethod.GET, path: `/contact-properties/${propsValue.contact_property_id}` });
  },
});
