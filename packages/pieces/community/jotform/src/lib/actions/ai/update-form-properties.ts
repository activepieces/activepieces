import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { jotformAuth } from '../../auth';
import { jotformCommon } from '../../common';
import { jotformUpdateFormPropertiesOutputSchema } from '../../output-schemas';

export const updateFormProperties = createAction({
  auth: jotformAuth,
  name: 'jotform_update_form_properties',
  outputSchema: jotformUpdateFormPropertiesOutputSchema,
  classification: 'WRITE',
  displayName: 'Update Form Properties',
  description: 'Update one or more properties of a form.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Updates one or more of a form\'s properties from a key/value map, e.g. {"title":"New Title"}. Only the supplied keys change; every other property is left alone. Idempotent — setting the same value again is a no-op.',
    idempotent: true,
  },
  props: {
    formId: Property.ShortText({
      displayName: 'Form ID',
      description: 'The ID of the form, from List Forms.',
      required: true,
    }),
    properties: Property.Json({
      displayName: 'Properties',
      description: 'Key/value map of properties to update, e.g. {"title":"New Title"}.',
      required: true,
    }),
  },
  async run(context) {
    const { formId, properties } = context.propsValue;
    if (
      typeof properties !== 'object' ||
      properties === null ||
      Array.isArray(properties)
    ) {
      throw new Error('properties must be a JSON object of key/value pairs.');
    }
    const body: Record<string, unknown> = {};
    Object.entries(properties as Record<string, unknown>).forEach(([key, value]) => {
      body[`properties[${key}]`] = value;
    });
    return jotformCommon.request({
      method: HttpMethod.POST,
      path: `/form/${formId}/properties`,
      apiKey: context.auth.props.apiKey,
      region: context.auth.props.region,
      body,
      form: true,
    });
  },
});
