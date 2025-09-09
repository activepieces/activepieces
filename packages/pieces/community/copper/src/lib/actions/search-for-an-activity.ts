import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod, AuthenticationType } from '@activepieces/pieces-common';
import { copperAuth } from '../common/auth';

export const searchForActivity = createAction({
  auth: copperAuth,
  name: 'search_for_activity',
  displayName: 'Search for an Activity',
  description: 'Find existing activities by type/criteria.',
  props: {
    parentId: Property.Number({
      displayName: 'Parent ID',
      description: 'ID of the parent entity to search activities for',
      required: false,
    }),
    parentType: Property.StaticDropdown({
      displayName: 'Parent Type',
      description: 'Type of the parent entity',
      required: false,
      defaultValue: 'person',
      options: {
        disabled: false,
        options: [
          { label: 'Person', value: 'person' },
          { label: 'Lead', value: 'lead' },
          { label: 'Opportunity', value: 'opportunity' },
          { label: 'Company', value: 'company' },
          { label: 'Project', value: 'project' },
          { label: 'Task', value: 'task' },
        ],
      },
    }),
    activityTypeId: Property.Number({
      displayName: 'Activity Type ID',
      description: 'ID of the activity type to filter by',
      required: false,
    }),
    activityCategory: Property.StaticDropdown({
      displayName: 'Activity Category',
      description: 'Category of the activity to filter by',
      required: false,
      defaultValue: 'user',
      options: {
        disabled: false,
        options: [
          { label: 'User', value: 'user' },
          { label: 'Email', value: 'email' },
          { label: 'Call', value: 'call' },
          { label: 'Meeting', value: 'meeting' },
          { label: 'Task', value: 'task' },
          { label: 'System', value: 'system' },
        ],
      },
    }),
    minimumActivityDate: Property.ShortText({
      displayName: 'Minimum Activity Date',
      description: 'Earliest activity date in YYYY-MM-DD format or Unix timestamp',
      required: false,
    }),
    maximumActivityDate: Property.ShortText({
      displayName: 'Maximum Activity Date',
      description: 'Latest activity date in YYYY-MM-DD format or Unix timestamp',
      required: false,
    }),
    pageNumber: Property.Number({
      displayName: 'Page Number',
      description: 'Page number to retrieve (starting with 1)',
      required: false,
      defaultValue: 1,
    }),
    pageSize: Property.Number({
      displayName: 'Page Size',
      description: 'Number of entries per page (max 200)',
      required: false,
      defaultValue: 20,
    }),
    fullResult: Property.Checkbox({
      displayName: 'Full Result',
      description: 'If true, improves search performance but may return duplicate activity logs (admin only)',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const {
      parentId,
      parentType,
      activityTypeId,
      activityCategory,
      minimumActivityDate,
      maximumActivityDate,
      pageNumber,
      pageSize,
      fullResult,
    } = context.propsValue;

    // Build the request body
    const requestBody: any = {};

    // Add parent filter if provided
    if (parentId && parentType) {
      requestBody.parent = {
        id: parentId,
        type: parentType,
      };
    }

    // Add activity type filter if provided
    if (activityTypeId || activityCategory) {
      requestBody.activity_types = [
        {
          id: activityTypeId || 0,
          category: activityCategory || 'user',
        },
      ];
    }

    // Add pagination if provided
    if (pageNumber) {
      requestBody.page_number = pageNumber;
    }
    if (pageSize) {
      requestBody.page_size = Math.min(pageSize, 200); // Cap at 200
    }

    // Add date filters if provided
    if (minimumActivityDate) {
      // Check if it's a Unix timestamp or date string
      if (/^\d+$/.test(minimumActivityDate)) {
        requestBody.minimum_activity_date = parseInt(minimumActivityDate);
      } else {
        // Convert date string to Unix timestamp
        requestBody.minimum_activity_date = Math.floor(new Date(minimumActivityDate).getTime() / 1000);
      }
    }

    if (maximumActivityDate) {
      // Check if it's a Unix timestamp or date string
      if (/^\d+$/.test(maximumActivityDate)) {
        requestBody.maximum_activity_date = parseInt(maximumActivityDate);
      } else {
        // Convert date string to Unix timestamp
        requestBody.maximum_activity_date = Math.floor(new Date(maximumActivityDate).getTime() / 1000);
      }
    }

    // Add full result flag if provided
    if (fullResult) {
      requestBody.full_result = fullResult;
    }

    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: 'https://api.copper.com/developer_api/v1/activities/search',
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: context.auth.access_token,
        },
        body: requestBody,
      });

      return response.body;
    } catch (error: any) {
      if (error.response?.status === 400) {
        throw new Error(`Bad request: ${JSON.stringify(error.response.body)}`);
      }
      if (error.response?.status === 401) {
        throw new Error('Authentication failed. Please check your credentials.');
      }
      if (error.response?.status === 403) {
        throw new Error('Access forbidden. Please check your permissions.');
      }
      throw new Error(`Error searching activities: ${error.message}`);
    }
  },
});
