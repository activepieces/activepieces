import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { quickbaseAuth, QuickbaseAuth } from '../common/auth';

export const createOrUpdateRecordsFromArray = createAction({
  auth: quickbaseAuth,
  name: 'create_or_update_records_from_array',
  displayName: 'Create or Update Records From Array',
  description: 'Creates or updates multiple records in a Quickbase table based on a merge field. All mapped fields are overwritten.',
  props: {
    tableId: Property.ShortText({
      displayName: 'Table ID',
      description: 'The ID of the Quickbase table where records will be created or updated',
      required: true,
    }),
    mergeFieldId: Property.Number({
      displayName: 'Merge Field ID',
      description: 'The field ID to use for matching existing records (e.g., email field, external ID field). If a record with this field value exists, it will be updated; otherwise, a new record will be created.',
      required: true,
    }),
    records: Property.Array({
      displayName: 'Records Array',
      description: 'Array of record objects. Each record should contain field IDs as keys with value objects (e.g., [{"6": {"value": "John"}, "7": {"value": "john@example.com"}}, {"6": {"value": "Jane"}, "7": {"value": "jane@example.com"}}])',
      required: true,
    }),
  },
  async run(context) {
    const { tableId, mergeFieldId, records } = context.propsValue;
    const auth = context.auth as QuickbaseAuth;

    // Validate that records is an array
    if (!Array.isArray(records)) {
      throw new Error('Records must be an array of record objects');
    }

    if (records.length === 0) {
      return {
        success: true,
        totalRecordsProcessed: 0,
        recordsCreated: 0,
        recordsUpdated: 0,
        recordsUnchanged: 0,
        message: 'No records to process',
      };
    }

    try {
      const response = await httpClient.sendRequest<{
        data: Array<{
          [key: string]: { value: any };
        }>;
        metadata: {
          createdRecordIds: number[];
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
          data: records,
          mergeFieldId: mergeFieldId,
          fieldsToReturn: [3], // Return all fields
        },
      });

      // Transform the response records to a more readable format
      const transformedRecords = (response.body.data || []).map((record) => {
        const transformedRecord: Record<string, any> = {};
        for (const [fieldId, fieldData] of Object.entries(record)) {
          transformedRecord[`field_${fieldId}`] = fieldData.value;
        }
        return transformedRecord;
      });

      return {
        success: true,
        totalRecordsProcessed: response.body.metadata.totalNumberOfRecordsProcessed,
        recordsCreated: response.body.metadata.createdRecordIds?.length || 0,
        recordsUpdated: response.body.metadata.updatedRecordIds?.length || 0,
        recordsUnchanged: response.body.metadata.unchangedRecordIds?.length || 0,
        createdRecordIds: response.body.metadata.createdRecordIds || [],
        updatedRecordIds: response.body.metadata.updatedRecordIds || [],
        unchangedRecordIds: response.body.metadata.unchangedRecordIds || [],
        records: transformedRecords,
      };
    } catch (error: any) {
      throw new Error(
        `Failed to create or update records in Quickbase: ${error.response?.body?.message || error.message || 'Unknown error'}`
      );
    }
  },
});
