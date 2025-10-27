import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { quickbaseAuth, QuickbaseAuth } from '../common/auth';

export const createRecord = createAction({
  auth: quickbaseAuth,
  name: 'create_record',
  displayName: 'Create Record',
  description: 'Creates a new record in a Quickbase table',
  props: {
    tableId: Property.ShortText({
      displayName: 'Table ID',
      description: 'The ID of the Quickbase table where the record will be created',
      required: true,
    }),
    fields: Property.Object({
      displayName: 'Fields',
      description: 'Record fields as key-value pairs where keys are field IDs (e.g., {"6": {"value": "John Doe"}, "7": {"value": "john@example.com"}})',
      required: true,
    }),
  },
  async run(context) {
    const { tableId, fields } = context.propsValue;
    const auth = context.auth as QuickbaseAuth;

    try {
      const response = await httpClient.sendRequest<{
        data: Array<{
          [key: string]: { value: any };
        }>;
        metadata: {
          createdRecordIds: number[];
          totalNumberOfRecordsProcessed: number;
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
          data: [fields],
          fieldsToReturn: [3], // Return all fields
        },
      });

      // Transform the response to a more readable format
      const createdRecord = response.body.data?.[0] || {};
      const transformedRecord: Record<string, any> = {};
      
      for (const [fieldId, fieldData] of Object.entries(createdRecord)) {
        transformedRecord[`field_${fieldId}`] = fieldData.value;
      }

      return {
        success: true,
        recordId: response.body.metadata.createdRecordIds[0],
        record: transformedRecord,
      };
    } catch (error: any) {
      throw new Error(
        `Failed to create record in Quickbase: ${error.response?.body?.message || error.message || 'Unknown error'}`
      );
    }
  },
});
