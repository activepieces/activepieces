import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { resendAuth } from '../..';
import { resendProps } from '../common/props';
import { resendClient } from '../common/client';
import { updateContactPropertyOutputSchema } from '../output-schemas';

export const updateContactProperty = createAction({
  name: 'update_contact_property',
  classification: 'WRITE',
  auth: resendAuth,
  displayName: 'Update Contact Property',
  outputSchema: updateContactPropertyOutputSchema,
  description: 'Update the fallback value of a custom contact field',
  audience: 'ai',
  aiMetadata: { description: "Updates the fallback value of an existing custom contact property, identified by ID. The key and type cannot be changed after creation — create a new property instead if either needs to change. Idempotent — re-applying the same value leaves the property unchanged.", idempotent: true },
  props: {
    contact_property_id: resendProps.contactPropertyId,
    fallback_value: Property.ShortText({
      displayName: 'Fallback Value',
      description: "New default value, used when the property is not set on a contact. Must match the property's type.",
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const existing = await resendClient.sendRequest<{ type: 'string' | 'number' }>({
      auth: auth.secret_text,
      method: HttpMethod.GET,
      path: `/contact-properties/${propsValue.contact_property_id}`,
    });

    let fallback_value: string | number = propsValue.fallback_value;
    if (existing.type === 'number') {
      const parsed = Number(propsValue.fallback_value);
      if (propsValue.fallback_value.trim() === '' || !Number.isFinite(parsed)) {
        throw new Error(`Fallback Value must be a valid number, got "${propsValue.fallback_value}".`);
      }
      fallback_value = parsed;
    }

    return await resendClient.sendRequest<{ object: string; id: string }>({
      auth: auth.secret_text,
      method: HttpMethod.PATCH,
      path: `/contact-properties/${propsValue.contact_property_id}`,
      body: { fallback_value },
    });
  },
});
