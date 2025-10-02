import { propsValidation } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import {
  makeInsightlyRequest,
  insightlyAuth,
  INSIGHTLY_OBJECTS,
  insightlyCommon
} from '../common/common';

export const findRecords = createAction({
  auth: insightlyAuth,
  name: 'find_records',
  displayName: 'Find Records',
  description:
    "Search for records using Insightly's search endpoint with field-based filtering",
  props: {
    pod: Property.ShortText({
      displayName: 'Pod',
      description:
        'Your Insightly pod (e.g., "na1", "eu1"). Find this in your API URL: https://api.{pod}.insightly.com',
      required: true
    }),
    objectName: Property.StaticDropdown({
      displayName: 'Object Type',
      description: 'Select the type of records to search',
      required: true,
      options: {
        options: INSIGHTLY_OBJECTS.map((obj) => ({
          label: obj,
          value: obj
        }))
      }
    }),
    fieldName: Property.ShortText({
      displayName: 'Field Name',
      description:
        'Field name to search by (e.g., "FIRST_NAME", "EMAIL_ADDRESS", "ORGANISATION_NAME"). Required if Field Value is provided.',
      required: false
    }),
    fieldValue: Property.ShortText({
      displayName: 'Field Value',
      description:
        'Value to search for in the specified field. Required if Field Name is provided.',
      required: false
    }),
    updatedAfterUtc: Property.ShortText({
      displayName: 'Updated After (UTC)',
      description:
        'Optional, earliest date when a record was last updated (ISO format: 2025-01-01T00:00:00Z)',
      required: false
    }),
    brief: Property.Checkbox({
      displayName: 'Brief Response',
      description:
        'Return only top-level properties (excludes TAGS, CUSTOMFIELDS, etc.)',
      required: false,
      defaultValue: false
    }),
    skip: Property.Number({
      displayName: 'Skip Records',
      description: 'Number of records to skip (for pagination)',
      required: false,
      defaultValue: 0
    }),
    top: Property.Number({
      displayName: 'Max Records',
      description:
        'Maximum number of records to return (default: 100, max: 500)',
      required: false,
      defaultValue: 100
    }),
    countTotal: Property.Checkbox({
      displayName: 'Count Total',
      description: 'Include total record count in response headers',
      required: false,
      defaultValue: false
    })
  },
  async run(context) {
    // Validate props using ActivePieces built-in validation
    await propsValidation.validateZod(
      context.propsValue,
      insightlyCommon.findRecordsSchema
    );

    const {
      pod,
      objectName,
      fieldName,
      fieldValue,
      updatedAfterUtc,
      brief,
      skip: skipRecords,
      top: maxRecords,
      countTotal
    } = context.propsValue;

    // Additional validation: field name and value must be provided together
    if ((fieldName && !fieldValue) || (!fieldName && fieldValue)) {
      throw new Error(
        'Field name and field value must both be provided together, or both left empty.'
      );
    }

    // Build query parameters
    const queryParams: string[] = [];

    if (fieldName && fieldValue) {
      queryParams.push(`field_name=${encodeURIComponent(fieldName)}`);
      queryParams.push(`field_value=${encodeURIComponent(fieldValue)}`);
    }

    if (updatedAfterUtc) {
      queryParams.push(
        `updated_after_utc=${encodeURIComponent(updatedAfterUtc)}`
      );
    }

    if (brief) {
      queryParams.push('brief=true');
    }

    if (skipRecords && skipRecords > 0) {
      queryParams.push(`skip=${skipRecords}`);
    }

    if (maxRecords && maxRecords > 0) {
      // Ensure top doesn't exceed API limit
      const limitedRecords = Math.min(maxRecords, 500);
      queryParams.push(`top=${limitedRecords}`);
    }

    if (countTotal) {
      queryParams.push('count_total=true');
    }

    // Build the search endpoint URL
    const endpoint = `/${objectName}/Search${
      queryParams.length > 0 ? '?' + queryParams.join('&') : ''
    }`;

    try {
      // Make the API request using the search endpoint
      const response = await makeInsightlyRequest(context.auth, endpoint, pod);

      // Process the response
      const records = Array.isArray(response.body) ? response.body : [];

      // Extract custom fields for each record for easier access (only if not brief)
      const processedRecords = records.map((record: any) => {
        const result: any = {
          recordId: record.RECORD_ID,
          recordName: record.RECORD_NAME,
          ownerUserId: record.OWNER_USER_ID,
          dateCreated: record.DATE_CREATED_UTC,
          visibleTo: record.VISIBLE_TO,
          visibleTeamId: record.VISIBLE_TEAM_ID,
          rawData: record
        };

        // Only process custom fields if not in brief mode
        if (
          !brief &&
          record.CUSTOMFIELDS &&
          Array.isArray(record.CUSTOMFIELDS)
        ) {
          const customFields: Record<string, any> = {};
          record.CUSTOMFIELDS.forEach((field: any) => {
            if (field.FIELD_NAME) {
              customFields[field.FIELD_NAME] = field.FIELD_VALUE;
            }
          });
          result.customFields = customFields;
        }

        return result;
      });

      // Get total count from headers if requested
      let totalCount: number | undefined;
      if (countTotal && response.headers) {
        const totalHeader = response.headers['x-total-count'];
        if (totalHeader) {
          totalCount = parseInt(
            Array.isArray(totalHeader) ? totalHeader[0] : totalHeader,
            10
          );
        }
      }

      return {
        success: true,
        recordCount: records.length,
        totalCount,
        records: processedRecords,
        pagination: {
          skip: skipRecords || 0,
          top: maxRecords || 100,
          hasMore: records.length === (maxRecords || 100)
        },
        searchCriteria:
          fieldName && fieldValue
            ? {
                fieldName,
                fieldValue,
                updatedAfterUtc
              }
            : { updatedAfterUtc }
      };
    } catch (error: any) {
      // Handle specific error cases
      if (error.response?.status === 400) {
        throw new Error(
          `Bad request: ${
            error.response.body?.message ||
            'Missing or invalid parameter. Check field names and values.'
          }`
        );
      } else if (error.response?.status === 401) {
        throw new Error(
          'Authentication failed. Please check your API key and pod.'
        );
      } else {
        throw new Error(`Failed to search records: ${error.message}`);
      }
    }
  }
});
