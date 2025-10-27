import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { quickbaseAuth, QuickbaseAuth } from '../common/auth';

export const updateRecord = createAction({
  auth: quickbaseAuth,
  name: 'update_record',
  displayName: 'Update Record',
  description: 'Updates fields of an existing record in a Quickbase table',
  props: {
    tableId: Property.ShortText({
      displayName: 'Table ID',
      description: 'The ID of the Quickbase table containing the record',
      required: true,
    }),
    recordId: Property.Number({
      displayName: 'Record ID',
      description: 'The ID of the record to update (field 3)',
      required: true,
    }),
    fields: Property.Object({
      displayName: 'Fields to Update',
      description: 'Record fields to update as key-value pairs where keys are field IDs (e.g., {"6": {"value": "Updated Name"}, "7": {"value": "new@example.com"}})',
      required: true,
    }),
  },
  async run(context) {
    const { tableId, recordId, fields } = context.propsValue;
    const auth = context.auth as QuickbaseAuth;

    try {
      // Merge the record ID (field 3) with the fields to update
      const recordData = {
        '3': { value: recordId }, // Field 3 is typically the Record ID field
        ...fields,
      };

      const response = await httpClient.sendRequest<{
        data: Array<{
          [key: string]: { value: any };
        }>;
        metadata: {
          totalNumberOfRecordsProcessed: number;
          unchangedRecordIds: number[];
          updatedRecordIds: number[];
        };
      }>({
        method: HttpMethod.POST,
        url: `https://api.quickbase.com/v1/records`,
        headers: {
          'QB-Realm-Hostname': auth.realm,
          Authorization: `QB-USER-TOKEN ${auth.userToken}`,
          'Content-Type': 'application/json',
        },
        body: {
          to: tableId,
          data: [recordData],
          fieldsToReturn: [3], // Return all fields
        },
      });

      // Check if the record was updated
      const wasUpdated = response.body.metadata.updatedRecordIds?.includes(recordId);
      const wasUnchanged = response.body.metadata.unchangedRecordIds?.includes(recordId);

      // Transform the response to a more readable format
      const updatedRecord = response.body.data?.[0] || {};
      const transformedRecord: Record<string, any> = {};
      
      for (const [fieldId, fieldData] of Object.entries(updatedRecord)) {
        transformedRecord[`field_${fieldId}`] = fieldData.value;
      }

      return {
        success: true,
        recordId: recordId,
        updated: wasUpdated,
        unchanged: wasUnchanged,
        record: transformedRecord,
      };
    } catch (error: any) {
      throw new Error(
        `Failed to update record in Quickbase: ${error.response?.body?.message || error.message || 'Unknown error'}`
      );
    }
  },
});
