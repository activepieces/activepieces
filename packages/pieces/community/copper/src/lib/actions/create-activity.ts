import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod, AuthenticationType } from '@activepieces/pieces-common';
import { copperAuth } from '../common/auth';

export const createActivity = createAction({
  auth: copperAuth,
  name: 'create_activity',
  displayName: 'Create Activity',
  description: 'Logs an activity related to CRM entities.',
  props: {
    parentId: Property.Number({
      displayName: 'Parent ID',
      description: 'ID of the parent entity (person, lead, opportunity, company, or project)',
      required: true,
    }),
    parentType: Property.StaticDropdown({
      displayName: 'Parent Type',
      description: 'Type of the parent entity',
      required: true,
      defaultValue: 'person',
      options: {
        disabled: false,
        options: [
          { label: 'Person', value: 'person' },
          { label: 'Lead', value: 'lead' },
          { label: 'Opportunity', value: 'opportunity' },
          { label: 'Company', value: 'company' },
          { label: 'Project', value: 'project' },
        ],
      },
    }),
    activityTypeId: Property.Number({
      displayName: 'Activity Type ID',
      description: 'ID of the activity type (0 for user note, other IDs for specific activity types)',
      required: false,
      defaultValue: 0,
    }),
    activityCategory: Property.StaticDropdown({
      displayName: 'Activity Category',
      description: 'Category of the activity',
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
        ],
      },
    }),
    details: Property.LongText({
      displayName: 'Details',
      description: 'Description or details of the activity',
      required: true,
    }),
    activityDate: Property.ShortText({
      displayName: 'Activity Date',
      description: 'Date of the activity in YYYY-MM-DD format or Unix timestamp (defaults to current time)',
      required: false,
    }),
    oldValue: Property.ShortText({
      displayName: 'Old Value',
      description: 'Previous value (for change tracking activities)',
      required: false,
    }),
    newValue: Property.ShortText({
      displayName: 'New Value',
      description: 'New value (for change tracking activities)',
      required: false,
    }),
  },
  async run(context) {
    const {
      parentId,
      parentType,
      activityTypeId,
      activityCategory,
      details,
      activityDate,
      oldValue,
      newValue,
    } = context.propsValue;

    // Build the request body
    const requestBody: any = {
      parent: {
        type: parentType,
        id: parentId,
      },
      type: {
        category: activityCategory || 'user',
        id: activityTypeId || 0,
      },
      details: details,
    };

    // Add activity date if provided
    if (activityDate) {
      // Check if it's a Unix timestamp or date string
      if (/^\d+$/.test(activityDate)) {
        requestBody.activity_date = parseInt(activityDate);
      } else {
        // Convert date string to Unix timestamp
        requestBody.activity_date = Math.floor(new Date(activityDate).getTime() / 1000);
      }
    }

    // Add old and new values if provided (for change tracking)
    if (oldValue !== undefined && oldValue !== '') {
      requestBody.old_value = oldValue;
    }
    if (newValue !== undefined && newValue !== '') {
      requestBody.new_value = newValue;
    }

    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: 'https://api.copper.com/developer_api/v1/activities',
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
      throw new Error(`Error creating activity: ${error.message}`);
    }
  },
});
