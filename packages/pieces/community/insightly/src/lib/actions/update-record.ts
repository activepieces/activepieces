import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod, AuthenticationType } from '@activepieces/pieces-common';
import { insightlyAuth } from '../common/common';

export const updateRecord = createAction({
  auth: insightlyAuth,
  name: 'update_record',
  displayName: 'Update Record',
  description: 'Update an existing record\'s fields in a specified Insightly object',
  props: {
    pod: Property.ShortText({
      displayName: 'Pod',
      description: 'Your Insightly pod (e.g., "na1", "eu1"). Find this in your API URL: https://api.{pod}.insightly.com',
      required: true,
    }),
    objectName: Property.StaticDropdown({
      displayName: 'Object Type',
      description: 'Select the type of record to update',
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
          { label: 'Quote', value: 'Quotations' },
        ],
      },
    }),
    recordId: Property.Number({
      displayName: 'Record ID',
      description: 'ID of the record to update',
      required: true,
    }),
    recordName: Property.ShortText({
      displayName: 'Record Name',
      description: 'New name for the record (optional - only include if you want to change it)',
      required: false,
    }),
    ownerUserId: Property.Number({
      displayName: 'Owner User ID',
      description: 'ID of the user who will own this record (optional)',
      required: false,
    }),
    visibleTo: Property.StaticDropdown({
      displayName: 'Visible To',
      description: 'Who can see this record (optional)',
      required: false,
      options: {
        options: [
          { label: 'Everyone', value: 'Everyone' },
          { label: 'Owner', value: 'Owner' },
          { label: 'Team', value: 'Team' },
        ],
      },
    }),
    visibleTeamId: Property.Number({
      displayName: 'Visible Team ID',
      description: 'ID of the team that can see this record (when Visible To is set to Team)',
      required: false,
    }),
    customFields: Property.Object({
      displayName: 'Custom Fields',
      description: 'Custom fields as key-value pairs. Use the exact FIELD_NAME from your Insightly instance. Use null to clear a field value.',
      required: false,
    }),
  },
  async run(context) {
    const { pod, objectName, recordId, recordName, ownerUserId, visibleTo, visibleTeamId, customFields } = context.propsValue;
    const apiKey = context.auth;

    // Build the API URL with record ID
    const baseUrl = `https://api.${pod}.insightly.com/v3.1`;
    const url = `${baseUrl}/${objectName}/${recordId}`;

    // Prepare the record data - only include fields that are being updated
    const recordData: any = {};

    // Add fields only if they are provided (PUT doesn't require all fields)
    if (recordName !== undefined && recordName !== '') {
      recordData.RECORD_NAME = recordName;
    }

    if (ownerUserId !== undefined) {
      recordData.OWNER_USER_ID = ownerUserId;
    }

    if (visibleTo !== undefined && visibleTo !== '') {
      recordData.VISIBLE_TO = visibleTo;
    }

    if (visibleTeamId !== undefined) {
      recordData.VISIBLE_TEAM_ID = visibleTeamId;
    }

    // Handle custom fields
    if (customFields && typeof customFields === 'object') {
      recordData.CUSTOMFIELDS = Object.entries(customFields).map(([fieldName, fieldValue]) => ({
        FIELD_NAME: fieldName,
        FIELD_VALUE: fieldValue, // Can be null to clear the field
      }));
    }

    // Ensure we have at least one field to update
    if (Object.keys(recordData).length === 0) {
      throw new Error('At least one field must be provided to update the record');
    }

    try {
      // Make the API request
      const response = await httpClient.sendRequest({
        method: HttpMethod.PUT,
        url,
        headers: {
          'Content-Type': 'application/json',
        },
        authentication: {
          type: AuthenticationType.BASIC,
          username: apiKey,
          password: '', // Insightly uses API key as username with blank password
        },
        body: recordData,
      });

      return {
        success: true,
        recordId: response.body.RECORD_ID,
        recordName: response.body.RECORD_NAME,
        dateCreated: response.body.DATE_CREATED_UTC,
        updatedFields: Object.keys(recordData),
        data: response.body,
      };
    } catch (error: any) {
      // Handle specific error cases
      if (error.response?.status === 400) {
        throw new Error(`Data validation error: ${error.response.body?.message || 'Invalid data provided or record not found'}`);
      } else if (error.response?.status === 401) {
        throw new Error('Authentication failed. Please check your API key and pod.');
      } else if (error.response?.status === 402) {
        throw new Error('Record limit reached for your Insightly plan.');
      } else if (error.response?.status === 404) {
        throw new Error(`Record with ID ${recordId} not found in ${objectName}`);
      } else {
        throw new Error(`Failed to update record: ${error.message}`);
      }
    }
  },
});