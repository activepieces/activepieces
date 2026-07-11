import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { dixaAuth } from '../auth';
import { dixaClient } from '../common/client';
import {
  buildContactCustomAttributeProps,
  endUserIdProp,
  listContactCustomAttributes,
  prepareCustomAttributePayload,
} from '../common/props';

export const setCustomContactAttributes = createAction({
  auth: dixaAuth,
  name: 'set_custom_contact_attributes',
  displayName: 'Set Custom Contact Attributes',
  description: 'Updates custom attributes for a specified end user.',
  audience: 'both',
  aiMetadata: {
    description:
      'Patch custom contact attributes on a Dixa end user. Attribute fields are loaded dynamically from your Dixa account configuration.',
    idempotent: false,
  },
  props: {
    userId: endUserIdProp('User ID'),
    customAttributes: Property.DynamicProperties({
      auth: dixaAuth,
      displayName: 'Custom Attributes',
      description: 'Custom attribute values for the selected user.',
      required: true,
      refreshers: ['userId'],
      props: async ({ auth }) => {
        if (!auth) {
          return {};
        }

        return buildContactCustomAttributeProps(auth.secret_text);
      },
    }),
  },
  async run({ auth, propsValue }) {
    const { userId, customAttributes } = propsValue;
    const attributes = await listContactCustomAttributes(auth.secret_text);

    return await dixaClient.makeRequest(
      auth.secret_text,
      HttpMethod.PATCH,
      `/endusers/${userId}/custom-attributes`,
      prepareCustomAttributePayload(
        attributes,
        customAttributes as Record<string, unknown>
      )
    );
  },
});
