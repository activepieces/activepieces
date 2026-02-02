import { createAction } from '@activepieces/pieces-framework';
import { quickbaseAuth } from '../../index';
import { appIdProp, tableIdProp, fieldsMapperProp, dynamicFieldsMapperProp } from '../common/props';
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
    fields: dynamicFieldsMapperProp,
  },
  async run(context) {
    const { appId, tableId, fields } = context.propsValue;
    const client = new QuickbaseClient(context.auth.props.realmHostname, context.auth.props.userToken);

    const tableFields = await client.get<QuickbaseField[]>(`/fields?tableId=${tableId}`);
    

    const recordData: Record<string, { value: any }> = {};
    
    for (const [key, value] of Object.entries(fields)) {
      if (key.startsWith('field_') && value) {
        const fieldId = key.replace('field_', '');
        recordData[fieldId] = { value };
      }
    }

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