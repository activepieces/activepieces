import { createAction } from '@activepieces/pieces-framework';
import { quickbaseAuth } from '../common/auth';
import { appIdProp, tableIdProp, fieldsMapperProp } from '../common/props';
import { QuickbaseClient } from '../common/client';
import { QuickbaseCreateRecordResponse, QuickbaseField } from '../common/types';
import { mapFieldsToRecord, validateRequiredFields } from '../common/utils';

export const createRecord = createAction({
  name: 'create_record',
  displayName: 'Create Record',
  description: 'Create a new record in a Quickbase table',
  auth: quickbaseAuth,
  props: {
    appId: appIdProp,
    tableId: tableIdProp,
    fields: fieldsMapperProp,
  },
  async run(context) {
    const { appId, tableId, fields } = context.propsValue;
    const client = new QuickbaseClient(context.auth);

    const tableFields = await client.get<QuickbaseField[]>(`/fields?tableId=${tableId}`);
    const requiredFields = tableFields.filter(f => f.required).map(f => f.id.toString());
    
    validateRequiredFields(fields, requiredFields);

    const recordData = mapFieldsToRecord(fields, tableFields);

    const response = await client.post<QuickbaseCreateRecordResponse>('/records', {
      to: tableId,
      data: [recordData],
      fieldsToReturn: tableFields.map(f => f.id),
    });

    return {
      recordId: response.metadata.createdRecordIds[0],
      record: response.data[0],
      success: true,
    };
  },
});