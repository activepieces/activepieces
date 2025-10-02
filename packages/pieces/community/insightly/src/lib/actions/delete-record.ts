import { propsValidation } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod, AuthenticationType } from '@activepieces/pieces-common';
import { insightlyAuth, insightlyCommon } from '../common/common';

export const deleteRecord = createAction({
  auth: insightlyAuth,
  name: 'delete_record',
  displayName: 'Delete Record',
  description: 'Delete a record by ID from a specified Insightly object',
  props: {
    pod: Property.ShortText({
      displayName: 'Pod',
      description: 'Your Insightly pod (e.g., "na1", "eu1"). Find this in your API URL: https://api.{pod}.insightly.com',
      required: true,
    }),
    objectName: Property.StaticDropdown({
      displayName: 'Object Type',
      description: 'Select the type of record to delete',
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
      description: 'ID of the record to delete',
      required: true,
    }),
    confirmDeletion: Property.Checkbox({
      displayName: 'Confirm Deletion',
      description: 'Check this box to confirm you want to permanently delete this record',
      required: true,
    }),
  },
  async run(context) {
    // Validate props using ActivePieces built-in validation (includes confirmation check)
    await propsValidation.validateZod(
      context.propsValue,
      insightlyCommon.deleteRecordSchema
    );

    const { pod, objectName, recordId, confirmDeletion } = context.propsValue;
    const apiKey = context.auth;

    // Build the API URL with record ID
    const baseUrl = `https://api.${pod}.insightly.com/v3.1`;
    const url = `${baseUrl}/${objectName}/${recordId}`;

    try {
      // Make the API request
      const response = await httpClient.sendRequest({
        method: HttpMethod.DELETE,
        url,
        authentication: {
          type: AuthenticationType.BASIC,
          username: apiKey,
          password: '', // Insightly uses API key as username with blank password
        },
      });

      return {
        success: true,
        message: `Record ${recordId} successfully deleted from ${objectName}`,
        recordId,
        objectName,
        statusCode: response.status,
      };
    } catch (error: any) {
      // Handle specific error cases
      if (error.response?.status === 202) {
        // 202 is actually success for delete operations
        return {
          success: true,
          message: `Record ${recordId} successfully deleted from ${objectName}`,
          recordId,
          objectName,
          statusCode: 202,
        };
      } else if (error.response?.status === 401) {
        throw new Error('Authentication failed. Please check your API key and pod.');
      } else if (error.response?.status === 403) {
        throw new Error('Access denied. You do not have permission to delete this record.');
      } else if (error.response?.status === 404) {
        throw new Error(`Record with ID ${recordId} not found in ${objectName}`);
      } else if (error.response?.status === 417) {
        throw new Error(`Delete failed. The record ${recordId} could not be deleted from ${objectName}.`);
      } else {
        throw new Error(`Failed to delete record: ${error.message}`);
      }
    }
  },
});