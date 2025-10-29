import { createAction } from '@activepieces/pieces-framework';
import { quickbaseAuth } from '../common/auth';
import { appIdProp, tableIdProp, recordIdProp, fieldsMapperProp } from '../common/props';
import { QuickbaseClient } from '../common/client';
import { QuickbaseUpdateRecordResponse, QuickbaseField } from '../common/types';
import { mapFieldsToRecord } from '../common/utils';

export const updateRecord = createAction({
  name: 'update_record',
  displayName: 'Update Record',
  description: 'Update an existing record in a Quickbase table',
  auth: quickbaseAuth,
  props: {
    appId: appIdProp,
    tableId: tableIdProp,
    recordId: recordIdProp,
    fields: fieldsMapperProp,
  },
  async run(context) {
    const { appId, tableId, recordId, fields } = context.propsValue;
    const client = new QuickbaseClient(context.auth);

    const tableFields = await client.get<QuickbaseField[]>(`/fields?tableId=${tableId}`);
    const recordData = mapFieldsToRecord(fields, tableFields);
    
    const keyField = tableFields.find(f => f.unique) || tableFields[0];
    recordData[keyField.id.toString()] = { value: recordId };

    const response = await client.patch<QuickbaseUpdateRecordResponse>('/records', {
      to: tableId,
      data: [recordData],
      fieldsToReturn: tableFields.map(f => f.id),
    });

    return {
      recordId: recordId,
      record: response.data[0],
      updated: response.metadata.updatedRecordIds.includes(Number(recordId)),
      success: true,
    };
  },
});