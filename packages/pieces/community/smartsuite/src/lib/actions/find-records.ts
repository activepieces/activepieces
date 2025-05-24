import { createAction, Property } from '@activepieces/pieces-framework';
import { SmartSuiteClient } from '../common/client';
import { appIdDropdown } from '../common/props';

export const findRecordsAction = createAction({
  name: 'find_records',
  displayName: 'Find Records',
  description: 'Find records in a SmartSuite app based on search criteria',
  props: {
    appId: appIdDropdown,
    query: Property.ShortText({
      displayName: 'Search Query',
      description: 'Optional search query to filter records',
      required: false,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of records to return',
      required: false,
      defaultValue: 10,
    }),
    sortField: Property.ShortText({
      displayName: 'Sort Field',
      description: 'Field ID to sort by',
      required: false,
    }),
  },
  async run({ propsValue, auth }) {
    const { appId, query, limit, sortField } = propsValue;
    const authValue = auth as { apiKey: string; workspaceId: string };
    const client = new SmartSuiteClient(authValue.apiKey, authValue.workspaceId);

    const params: Record<string, string> = {};

    if (query) params['query'] = query;
    if (limit) params['limit'] = limit.toString();
    if (sortField) params['sort_field'] = sortField;

    return await client.findRecords(appId, params);
  },
});
