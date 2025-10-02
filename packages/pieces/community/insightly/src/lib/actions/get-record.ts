import { propsValidation } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod, AuthenticationType } from '@activepieces/pieces-common';
import { insightlyAuth, insightlyCommon } from '../common/common';

export const getRecord = createAction({
  auth: insightlyAuth,
  name: 'get_record',
  displayName: 'Get Record',
  description: 'Get a record by ID from a specified Insightly object',
  props: {
    pod: Property.ShortText({
      displayName: 'Pod',
      description: 'Your Insightly pod (e.g., "na1", "eu1"). Find this in your API URL: https://api.{pod}.insightly.com',
      required: true,
    }),
    objectName: Property.StaticDropdown({
      displayName: 'Object Type',
      description: 'Select the type of record to retrieve',
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
      description: 'ID of the record to retrieve',
      required: true,
    }),
  },
  async run(context) {
    // Validate props using ActivePieces built-in validation
    await propsValidation.validateZod(
      context.propsValue,
      insightlyCommon.getRecordSchema
    );

    const { pod, objectName, recordId } = context.propsValue;
    const apiKey = context.auth;

    // Build the API URL with record ID
    const baseUrl = `https://api.${pod}.insightly.com/v3.1`;
    const url = `${baseUrl}/${objectName}/${recordId}`;

    try {
      // Make the API request
      const response = await httpClient.sendRequest({
        method: HttpMethod.GET,
        url,
        authentication: {
          type: AuthenticationType.BASIC,
          username: apiKey,
          password: '', // Insightly uses API key as username with blank password
        },
      });

      // Extract custom fields for easier access
      const customFields: Record<string, any> = {};
      if (response.body.CUSTOMFIELDS && Array.isArray(response.body.CUSTOMFIELDS)) {
        response.body.CUSTOMFIELDS.forEach((field: any) => {
          if (field.FIELD_NAME) {
            customFields[field.FIELD_NAME] = field.FIELD_VALUE;
          }
        });
      }

      return {
        success: true,
        recordId: response.body.RECORD_ID,
        recordName: response.body.RECORD_NAME,
        ownerUserId: response.body.OWNER_USER_ID,
        dateCreated: response.body.DATE_CREATED_UTC,
        visibleTo: response.body.VISIBLE_TO,
        visibleTeamId: response.body.VISIBLE_TEAM_ID,
        customFields,
        rawData: response.body,
      };
    } catch (error: any) {
      // Handle specific error cases
      if (error.response?.status === 400) {
        throw new Error(`Bad request: ${error.response.body?.message || 'Missing or invalid parameter'}`);
      } else if (error.response?.status === 401) {
        throw new Error('Authentication failed. Please check your API key and pod.');
      } else if (error.response?.status === 403) {
        throw new Error('Access denied. You do not have permission to access this record.');
      } else if (error.response?.status === 404) {
        throw new Error(`Record with ID ${recordId} not found in ${objectName}`);
      } else {
        throw new Error(`Failed to retrieve record: ${error.message}`);
      }
    }
  },
});