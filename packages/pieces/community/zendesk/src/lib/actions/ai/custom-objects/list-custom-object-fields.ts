import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { zendeskAuth } from '../../../auth';
import { zendeskApi } from '../../../common/api';
import { zendeskAiProps } from '../../../common/ai-props';
import { zendeskListCustomObjectFieldsOutputSchema } from '../../../output-schemas';

export const zendeskListCustomObjectFields = createAction({
  auth: zendeskAuth,
  name: 'zendesk_list_custom_object_fields',
  outputSchema: zendeskListCustomObjectFieldsOutputSchema,
  displayName: 'List Custom Object Fields',
  description: 'List the fields of a custom object.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists the fields of one custom object with their keys, types and options, which Create, Update and Upsert Custom Object Record use in custom_object_fields.',
    idempotent: true,
  },
  props: {
    custom_object_key: zendeskAiProps.requiredId({ displayName: 'Custom Object Key', description: 'The object key, from List Custom Objects.' }),
    include_standard_fields: Property.StaticDropdown({
      displayName: 'Include Standard Fields',
      description: 'Also return the built-in name and external ID fields.',
      required: false,
      options: { options: [{ label: 'Yes', value: 'true' }, { label: 'No', value: 'false' }] },
    }),
  },
  async run({ auth, propsValue }) {
    const customObjectKey = zendeskApi.pathSegment({ value: propsValue.custom_object_key, label: 'Custom Object Key' });
    const response = await zendeskApi.request<{ custom_object_fields: unknown[] }>({
      auth,
      method: HttpMethod.GET,
      path: `/custom_objects/${customObjectKey}/fields.json`,
      queryParams: zendeskApi.query({ include_standard_fields: propsValue.include_standard_fields }),
    });
    return { custom_object_fields: response.custom_object_fields, count: response.custom_object_fields.length };
  },
});
