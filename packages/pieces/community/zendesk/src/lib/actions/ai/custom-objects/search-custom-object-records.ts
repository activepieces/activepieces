import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { zendeskAuth } from '../../../auth';
import { CursorMeta, zendeskApi } from '../../../common/api';
import { zendeskAiProps } from '../../../common/ai-props';
import { zendeskListCustomObjectRecordsOutputSchema } from '../../../output-schemas';

export const zendeskSearchCustomObjectRecords = createAction({
  auth: zendeskAuth,
  name: 'zendesk_search_custom_object_records',
  outputSchema: zendeskListCustomObjectRecordsOutputSchema,
  displayName: 'Search Custom Object Records',
  description: 'Search the records of a custom object.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Searches the records of one custom object by name and text field values. Use List Custom Object Records to page through all records or fetch by external ID.',
    idempotent: true,
  },
  props: {
    custom_object_key: zendeskAiProps.requiredId({ displayName: 'Custom Object Key', description: 'The object key, from List Custom Objects.' }),
    query: Property.ShortText({ displayName: 'Query', description: 'Text to search for in record names and text fields.', required: true }),
    limit: zendeskAiProps.limit(),
    cursor: zendeskAiProps.cursor(),
  },
  async run({ auth, propsValue }) {
    const customObjectKey = zendeskApi.pathSegment({ value: propsValue.custom_object_key, label: 'Custom Object Key' });
    const response = await zendeskApi.request<{ custom_object_records: unknown[]; meta?: CursorMeta }>({
      auth,
      method: HttpMethod.GET,
      path: `/custom_objects/${customObjectKey}/records/search.json`,
      queryParams: {
        ...zendeskApi.cursorQuery({ limit: propsValue.limit, cursor: propsValue.cursor }),
        ...zendeskApi.query({ query: propsValue.query }),
      },
    });
    return {
      custom_object_records: response.custom_object_records,
      count: response.custom_object_records.length,
      ...zendeskApi.cursorResult(response.meta),
    };
  },
});
