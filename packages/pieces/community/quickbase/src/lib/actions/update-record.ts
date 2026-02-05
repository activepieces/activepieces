import { createAction } from '@activepieces/pieces-framework';
import { quickbaseAuth } from '../../index';
import { appIdProp, tableIdProp, recordIdDropdownProp, dynamicFieldsMapperProp } from '../common/props';
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
    recordId: recordIdDropdownProp,
    fields: dynamicFieldsMapperProp,
  },
  async run(context) {
    const { appId, tableId, recordId, fields } = context.propsValue;
    const client = new QuickbaseClient(context.auth.props.realmHostname, context.auth.props.userToken);

    const tableFields = await client.get<QuickbaseField[]>(`/fields?tableId=${tableId}`);
    

    const recordData: Record<string, { value: any }> = {
      '3': { value: recordId },
    };
    
    for (const [key, value] of Object.entries(fields)) {
      if (key.startsWith('field_') && value) {
        const fieldId = key.replace('field_', '');
        recordData[fieldId] = { value };
      }
    }

    const response = await client.post<QuickbaseUpdateRecordResponse>('/records', {
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