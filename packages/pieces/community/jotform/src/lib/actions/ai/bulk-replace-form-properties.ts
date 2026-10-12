import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { jotformAuth } from '../../auth';
import { jotformCommon } from '../../common';
import { jotformBulkReplaceFormPropertiesOutputSchema } from '../../output-schemas';

export const bulkReplaceFormProperties = createAction({
  auth: jotformAuth,
  name: 'jotform_bulk_replace_form_properties',
  outputSchema: jotformBulkReplaceFormPropertiesOutputSchema,
  classification: 'WRITE',
  displayName: 'Bulk Replace Form Properties',
  description: "Bulk-replace all of a form's properties from a JSON object.",
  audience: 'ai',
  aiMetadata: {
    description:
      "Replaces a form's properties from a JSON object keyed by property name. Not a merge — read the form's current properties first if any should be kept. Not idempotent — every call rewrites the property set.",
    idempotent: false,
  },
  props: {
    formId: Property.ShortText({
      displayName: 'Form ID',
      description: 'The ID of the form, from List Forms.',
      required: true,
    }),
    properties: Property.Json({
      displayName: 'Properties',
      description: 'JSON object of properties to replace the form\'s properties with.',
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
    return jotformCommon.request({
      method: HttpMethod.PUT,
      path: `/form/${formId}/properties`,
      apiKey: context.auth.props.apiKey,
      region: context.auth.props.region,
      body: { properties },
    });
  },
});
