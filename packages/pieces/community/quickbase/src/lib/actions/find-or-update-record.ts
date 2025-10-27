import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { quickbaseAuth, QuickbaseAuth } from '../common/auth';

export const findOrCreateRecord = createAction({
  auth: quickbaseAuth,
  name: 'find_or_create_record',
  displayName: 'Find or Create Record',
  description: 'Finds an existing record or creates one if it doesn\'t exist',
  props: {
    tableId: Property.ShortText({
      displayName: 'Table ID',
      description: 'The ID of the Quickbase table to search in or create the record',
      required: true,
    }),
    searchField: Property.Number({
      displayName: 'Search Field ID',
      description: 'The field ID to search by (e.g., email field ID, external ID field)',
      required: true,
    }),
    searchValue: Property.ShortText({
      displayName: 'Search Value',
      description: 'The value to search for in the search field',
      required: true,
    }),
    fieldsToCreate: Property.Object({
      displayName: 'Fields to Create (if not found)',
      description: 'Record fields to use when creating a new record as key-value pairs where keys are field IDs (e.g., {"6": {"value": "John Doe"}, "7": {"value": "john@example.com"}}). Make sure to include the search field and value here.',
      required: true,
    }),
  },
  async run(context) {
    const { tableId, searchField, searchValue, fieldsToCreate } = context.propsValue;
    const auth = context.auth as QuickbaseAuth;

    try {
      // Step 1: Try to find the record
      const searchQuery = {
        from: tableId,
        select: [3], // Return all fields
        where: `{${searchField}.EX.'${searchValue}'}`,
        options: {
          skip: 0,
          top: 1, // Only need the first match
        },
      };

      const searchResponse = await httpClient.sendRequest<{
        data: Array<{
          [key: string]: { value: any };
        }>;
        metadata: {
          totalRecords: number;
        };
      }>({
        method: HttpMethod.POST,
        url: `https://api.quickbase.com/v1/records/query`,
        headers: {
          'QB-Realm-Hostname': auth.realm,
          Authorization: `QB-USER-TOKEN ${auth.userToken}`,
          'Content-Type': 'application/json',
        },
        body: searchQuery,
      });

      const foundRecords = searchResponse.body.data || [];

      // If record exists, return it
      if (foundRecords.length > 0) {
        const existingRecord = foundRecords[0];
        const transformedRecord: Record<string, any> = {};
        
        for (const [fieldId, fieldData] of Object.entries(existingRecord)) {
          transformedRecord[`field_${fieldId}`] = fieldData.value;
        }

        return {
          success: true,
          action: 'found',
          recordId: transformedRecord['field_3'],
          record: transformedRecord,
          message: 'Record already exists',
        };
      }

      // Step 2: Record not found, create it
      const createResponse = await httpClient.sendRequest<{
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
          data: [fieldsToCreate],
          fieldsToReturn: [3], // Return all fields
        },
      });

      // Transform the created record
      const createdRecord = createResponse.body.data?.[0] || {};
      const transformedRecord: Record<string, any> = {};
      
      for (const [fieldId, fieldData] of Object.entries(createdRecord)) {
        transformedRecord[`field_${fieldId}`] = fieldData.value;
      }

      return {
        success: true,
        action: 'created',
        recordId: createResponse.body.metadata.createdRecordIds[0],
        record: transformedRecord,
        message: 'Record created successfully',
      };
    } catch (error: any) {
      throw new Error(
        `Failed to find or create record in Quickbase: ${error.response?.body?.message || error.message || 'Unknown error'}`
      );
    }
  },
});
