import { createAction, Property } from '@activepieces/pieces-framework';
import {
  tableDropdown,
  recordDropdown,
  createServiceNowClient,
  servicenowAuth,
  resolveSysId,
} from '../common/props';

export const deleteRecordAction = createAction({
  auth: servicenowAuth,
  name: 'delete_record',
  displayName: 'Delete Record',
  description: 'Delete a record from a specified table',
  props: {
    table: tableDropdown,
    record: recordDropdown,
    manual_sys_id: Property.ShortText({
      displayName: 'Or Enter Sys ID Manually',
      description: 'Enter the sys_id directly if not found in dropdown',
      required: false,
    }),
  },
  async run(context) {
    const { table, record, manual_sys_id } = context.propsValue;
    const sysId = resolveSysId({ selected: record, manual: manual_sys_id });

    const client = createServiceNowClient(context.auth);
    await client.deleteRecord(table, sysId);

    return {
      success: true,
      table,
      sys_id: sysId,
    };
  },
});
