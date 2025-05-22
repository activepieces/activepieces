import { createAction, Property } from '@activepieces/pieces-framework';
import { SmartSuiteClient } from '../common/client';
import { appIdDropdown } from '../common/props';

export const getRecordAction = createAction({
  name: 'get_record',
  displayName: 'Get Record',
  description: 'Get a specific record from SmartSuite by ID',
  props: {
    appId: appIdDropdown,
    recordId: Property.ShortText({
      displayName: 'Record ID',
      description: 'The ID of the record to retrieve',
      required: true,
    }),
  },
  async run({ propsValue, auth }) {
    const { appId, recordId } = propsValue;
    const authValue = auth as { apiKey: string; workspaceId: string };
    const client = new SmartSuiteClient(authValue.apiKey, authValue.workspaceId);

    return await client.getRecord(appId, recordId);
  },
});
