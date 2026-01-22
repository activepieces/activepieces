import { nocodbAuth } from '../../';
import {
  createAction,
  DynamicPropsValue,
  Property,
} from '@activepieces/pieces-framework';
import { makeClient, nocodbCommon } from '../common';

export const updateRecordAction = createAction({
  auth: nocodbAuth,
  name: 'nocodb-update-record',
  displayName: 'Update a Record',
  description: 'Updates an existing record with the given Record ID.',
  props: {
    workspaceId: nocodbCommon.workspaceId,
    baseId: nocodbCommon.baseId,
    tableId: nocodbCommon.tableId,
    recordId: Property.Number({
      displayName: 'Record ID',
      required: true,
    }),
    tableColumns: nocodbCommon.tableColumns,
  },
  async run(context) {
    const { baseId, tableId, recordId, tableColumns } = context.propsValue;

    const authVersion = context.auth.props.version || 3;
    let recordInput: DynamicPropsValue = {};
    if (authVersion === 4) {
      recordInput['id'] = recordId;
			recordInput['fields'] = {};
    } else {
      recordInput = {
        Id: recordId,
      };
    }

    Object.entries(tableColumns).forEach(([key, value]) => {
			if(authVersion === 4) {
					recordInput['fields'][key] = value;
			} else {
				if (Array.isArray(value)) {
					recordInput[key] = value.join(',');
				} else {
					recordInput[key] = value;
				}
			}
    });

    const client = makeClient(context.auth);
    return await client.updateRecord(baseId, tableId, recordInput, authVersion);
  },
});
