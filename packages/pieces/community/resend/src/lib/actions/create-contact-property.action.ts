import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { resendAuth } from '../..';
import { resendClient } from '../common/client';
import { createContactPropertyOutputSchema } from '../output-schemas';

export const createContactProperty = createAction({
  name: 'create_contact_property',
  classification: 'WRITE',
  auth: resendAuth,
  displayName: 'Create Contact Property',
  outputSchema: createContactPropertyOutputSchema,
  description: 'Define a new custom field for contacts',
  audience: 'ai',
  aiMetadata: { description: 'Creates a new custom contact property (a typed field, e.g. "plan_tier") that can be set per contact account-wide. Use this before referencing the property on a contact or template variable. The key and type are immutable after creation. Not idempotent — each call creates a new property even if the key matches an existing one.', idempotent: false },
  props: {
    key: Property.ShortText({
      displayName: 'Key',
      description: 'Property name, up to 50 characters, alphanumeric and underscores only.',
      required: true,
    }),
    type: Property.StaticDropdown({
      displayName: 'Type',
      required: true,
      options: {
        options: [
          { label: 'String', value: 'string' },
          { label: 'Number', value: 'number' },
        ],
      },
    }),
    fallback_value: Property.ShortText({
      displayName: 'Fallback Value',
      description: 'Default value used when the property is not set on a contact. Must match the selected type.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const body: Record<string, unknown> = { key: propsValue.key, type: propsValue.type };
    if (propsValue.fallback_value !== undefined && propsValue.fallback_value !== '') {
      if (propsValue.type === 'number') {
        const parsed = Number(propsValue.fallback_value);
        if (!Number.isFinite(parsed)) {
          throw new Error(`Fallback Value must be a valid number, got "${propsValue.fallback_value}".`);
        }
        body['fallback_value'] = parsed;
      } else {
        body['fallback_value'] = propsValue.fallback_value;
      }
    }

    return await resendClient.sendRequest<{ object: string; id: string }>({ auth: auth.secret_text, method: HttpMethod.POST, path: '/contact-properties', body: body });
  },
});
