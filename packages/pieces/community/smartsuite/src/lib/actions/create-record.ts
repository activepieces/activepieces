import { createAction, Property } from '@activepieces/pieces-framework';
import { SmartSuiteClient } from '../common/client';
import { appIdDropdown } from '../common/props';

export const createRecordAction = createAction({
  name: 'create_record',
  displayName: 'Create Record',
  description: 'Create a new record in SmartSuite',
  props: {
    appId: appIdDropdown,
    record: Property.Object({
      displayName: 'Record Data',
      description: 'The data for the record to create. Use field IDs as keys.',
      required: true,
    }),
  },
  async run({ propsValue, auth }) {
    const { appId, record } = propsValue;
    const authValue = auth as { apiKey: string; workspaceId: string };
    const client = new SmartSuiteClient(authValue.apiKey, authValue.workspaceId);

    return await client.createRecord(appId, record);
  },
});
