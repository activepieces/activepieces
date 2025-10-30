import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { quickbaseAuth, QuickbaseAuth } from '../common/auth';

export const findRecord = createAction({
  auth: quickbaseAuth,
  name: 'find_record',
  displayName: 'Find Record',
  description: 'Finds records in a Quickbase table based on search criteria',
  props: {
    tableId: Property.ShortText({
      displayName: 'Table ID',
      description: 'The ID of the Quickbase table to search in',
      required: true,
    }),
    where: Property.LongText({
      displayName: 'Query (Where Clause)',
      description: 'Quickbase query to filter records (e.g., "{7.EX.\'john@example.com\'}" to find by email field 7, or "{10.CT.\'Active\'}" for contains search)',
      required: true,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of records to return (default: 10, max: 1000)',
      required: false,
      defaultValue: 10,
    }),
    sortFieldId: Property.Number({
      displayName: 'Sort By Field ID',
      description: 'Field ID to sort results by (optional)',
      required: false,
    }),
    sortOrder: Property.StaticDropdown({
      displayName: 'Sort Order',
      description: 'Sort order for results',
      required: false,
      defaultValue: 'ASC',
      options: {
        options: [
          { label: 'Ascending', value: 'ASC' },
          { label: 'Descending', value: 'DESC' },
        ],
      },
    }),
  },
  async run(context) {
    const { tableId, where, limit, sortFieldId, sortOrder } = context.propsValue;
    const auth = context.auth as QuickbaseAuth;

    const queryBody: any = {
      from: tableId,
      select: [3], // Return all fields
      where: where,
      options: {
        skip: 0,
        top: Math.min(limit || 10, 1000), // Cap at 1000 records
      },
    };

    // Add sorting if specified
    if (sortFieldId) {
      queryBody.sortBy = [
        {
          fieldId: sortFieldId,
          order: sortOrder || 'ASC',
        },
      ];
    }

    try {
      const response = await httpClient.sendRequest<{
        data: Array<{
          [key: string]: { value: any };
        }>;
        metadata: {
          totalRecords: number;
          numRecords: number;
          numFields: number;
          skip: number;
        };
      }>({
        method: HttpMethod.POST,
        url: `https://api.quickbase.com/v1/records/query`,
        headers: {
          'QB-Realm-Hostname': auth.realm,
          Authorization: `QB-USER-TOKEN ${auth.userToken}`,
          'Content-Type': 'application/json',
        },
        body: queryBody,
      });

      const records = response.body.data || [];

      // Transform records to a more readable format
      const transformedRecords = records.map((record) => {
        const transformedRecord: Record<string, any> = {};
        for (const [fieldId, fieldData] of Object.entries(record)) {
          transformedRecord[`field_${fieldId}`] = fieldData.value;
        }
        return transformedRecord;
      });

      return {
        success: true,
        found: records.length > 0,
        recordCount: records.length,
        totalRecords: response.body.metadata.totalRecords,
        records: transformedRecords,
        // For convenience, return the first record separately if found
        firstRecord: transformedRecords[0] || null,
      };
    } catch (error: any) {
      throw new Error(
        `Failed to find records in Quickbase: ${error.response?.body?.message || error.message || 'Unknown error'}`
      );
    }
  },
});
