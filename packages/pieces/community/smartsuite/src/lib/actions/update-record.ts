import { createAction, Property } from '@activepieces/pieces-framework';
import { SmartSuiteClient } from '../common/client';
import { appIdDropdown } from '../common/props';

export const updateRecordAction = createAction({
  name: 'update_record',
  displayName: 'Update Record',
  description: 'Update an existing record in SmartSuite',
  props: {
    appId: appIdDropdown,
    recordId: Property.ShortText({
      displayName: 'Record ID',
      description: 'The ID of the record to update',
      required: true,
    }),
    record: Property.Object({
      displayName: 'Record Data',
      description: 'The data to update in the record. Use field IDs as keys.',
      required: true,
    }),
  },
  async run({ propsValue, auth }) {
    const { appId, recordId, record } = propsValue;
    const authValue = auth as { apiKey: string; workspaceId: string };
    const client = new SmartSuiteClient(authValue.apiKey, authValue.workspaceId);

    return await client.updateRecord(appId, recordId, record);
  },
});
