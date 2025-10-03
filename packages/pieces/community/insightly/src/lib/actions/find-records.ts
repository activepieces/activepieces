import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType
} from '@activepieces/pieces-common';
import { insightlyAuth } from '../common/common';

export const findRecords = createAction({
  auth: insightlyAuth,
  name: 'find_records',
  displayName: 'Find Records',
  description: 'Gets a filtered list of records from a specified Insightly object',
  props: {
    pod: Property.ShortText({
      displayName: 'Pod',
      description: 'Your Insightly pod (e.g., "na1", "eu1"). Find this in your API URL: https://api.{pod}.insightly.com',
      required: true,
      defaultValue: 'na1'
    }),
    objectName: Property.StaticDropdown({
      displayName: 'Object Type',
      description: 'Select the type of records to find',
      required: true,
      options: {
        options: [
          { label: 'Contact', value: 'Contacts' },
          { label: 'Lead', value: 'Leads' },
          { label: 'Opportunity', value: 'Opportunities' },
          { label: 'Organization', value: 'Organisations' },
          { label: 'Project', value: 'Projects' },
          { label: 'Task', value: 'Tasks' },
          { label: 'Event', value: 'Events' },
          { label: 'Note', value: 'Notes' },
          { label: 'Product', value: 'Products' },
          { label: 'Quote', value: 'Quotations' }
        ]
      }
    }),
    fieldName: Property.ShortText({
      displayName: 'Field Name',
      description: 'Optional, field name for object (e.g., "FIRST_NAME", "EMAIL_ADDRESS")',
      required: false
    }),
    fieldValue: Property.ShortText({
      displayName: 'Field Value',
      description: 'Optional, field value of the record',
      required: false
    }),
    updatedAfter: Property.ShortText({
      displayName: 'Updated After',
      description: 'Optional, earliest date when a record was last updated (ISO format: 2025-01-01T00:00:00Z)',
      required: false
    }),
    brief: Property.Checkbox({
      displayName: 'Brief',
      description: 'True if response should only contain top level properties of the record',
      required: false,
      defaultValue: false
    }),
    skip: Property.Number({
      displayName: 'Skip',
      description: 'Optional, number of records to skip',
      required: false
    }),
    top: Property.Number({
      displayName: 'Top',
      description: 'Optional, maximum number of records to return in the response',
      required: false
    }),
    countTotal: Property.Checkbox({
      displayName: 'Count Total',
      description: 'Optional, true if total number of records should be returned in the response headers',
      required: false,
      defaultValue: false
    })
  },
  async run(context) {
    const {
      pod,
      objectName,
      fieldName,
      fieldValue,
      updatedAfter,
      brief,
      skip,
      top,
      countTotal
    } = context.propsValue;
    const apiKey = context.auth;

    // Build query parameters
    const queryParams: string[] = [];

    if (fieldName) {
      queryParams.push(`field_name=${encodeURIComponent(fieldName)}`);
    }

    if (fieldValue) {
      queryParams.push(`field_value=${encodeURIComponent(fieldValue)}`);
    }

    if (updatedAfter) {
      queryParams.push(`updated_after=${encodeURIComponent(updatedAfter)}`);
    }

    if (brief) {
      queryParams.push('brief=true');
    }

    if (skip !== undefined && skip > 0) {
      queryParams.push(`skip=${skip}`);
    }

    if (top !== undefined && top > 0) {
      queryParams.push(`top=${top}`);
    }

    if (countTotal) {
      queryParams.push('count_total=true');
    }

    // Build the API URL
    const baseUrl = `https://api.${pod}.insightly.com/v3.1`;
    const url = `${baseUrl}/${objectName}${queryParams.length > 0 ? '?' + queryParams.join('&') : ''}`;

    try {
      // Make the API request
      const response = await httpClient.sendRequest({
        method: HttpMethod.GET,
        url,
        headers: {
          'Content-Type': 'application/json'
        },
        authentication: {
          type: AuthenticationType.BASIC,
          username: apiKey,
          password: '' // Insightly uses API key as username with blank password
        }
      });

      // Process the response
      const records = Array.isArray(response.body) ? response.body : [];

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
        records,
        filters: {
          fieldName,
          fieldValue,
          updatedAfter,
          brief,
          skip: skip || 0,
          top: top || undefined
        }
      };
    } catch (error: any) {
      // Handle specific error cases
      if (error.response?.status === 400) {
        const errorMessage = error.response.body?.message || error.response.body?.error || 'Bad request';
        throw new Error(`Bad request: ${errorMessage}`);
      } else if (error.response?.status === 401) {
        throw new Error('Authentication failed. Please check your API key and pod.');
      } else if (error.response?.status === 404) {
        throw new Error(`Object type ${objectName} not found`);
      } else {
        throw new Error(`Failed to find records: ${error.message}`);
      }
    }
  }
});
