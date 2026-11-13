import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { zendeskAuth } from '../../../auth';
import { CursorMeta, zendeskApi } from '../../../common/api';
import { zendeskAiProps } from '../../../common/ai-props';
import { zendeskListCustomObjectRecordsOutputSchema } from '../../../output-schemas';

export const zendeskListCustomObjectRecords = createAction({
  auth: zendeskAuth,
  name: 'zendesk_list_custom_object_records',
  outputSchema: zendeskListCustomObjectRecordsOutputSchema,
  displayName: 'List Custom Object Records',
  description: 'List the records of a custom object.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists the records of one custom object, optionally only the given external IDs. Use Search Custom Object Records to match on text or field values.',
    idempotent: true,
  },
  props: {
    custom_object_key: zendeskAiProps.requiredId({ displayName: 'Custom Object Key', description: 'The object key, from List Custom Objects.' }),
    external_ids: Property.ShortText({ displayName: 'External IDs', description: 'Comma-separated external IDs to return.', required: false }),
    limit: zendeskAiProps.limit(),
    cursor: zendeskAiProps.cursor(),
  },
  async run({ auth, propsValue }) {
    const customObjectKey = zendeskApi.pathSegment({ value: propsValue.custom_object_key, label: 'Custom Object Key' });
    const response = await zendeskApi.request<{ custom_object_records: unknown[]; meta?: CursorMeta }>({
      auth,
      method: HttpMethod.GET,
      path: `/custom_objects/${customObjectKey}/records.json`,
      queryParams: {
        ...zendeskApi.cursorQuery({ limit: propsValue.limit, cursor: propsValue.cursor }),
        ...zendeskApi.query({ 'filter[external_ids]': propsValue.external_ids }),
      },
    });
    return {
      custom_object_records: response.custom_object_records,
      count: response.custom_object_records.length,
      ...zendeskApi.cursorResult(response.meta),
    };
  },
});
