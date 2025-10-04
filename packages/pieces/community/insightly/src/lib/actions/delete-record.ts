import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod, AuthenticationType } from '@activepieces/pieces-common';
import { insightlyAuth } from '../common/common';

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
      defaultValue: 'na1'
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
          { label: 'Quote', value: 'Quotation' }
        ]
      }
    }),
    recordId: Property.Dropdown({
      displayName: 'Record ID',
      description: 'Select the record to delete',
      required: true,
      refreshers: ['objectName', 'pod'],
      options: async ({ auth, objectName, pod }) => {
        if (!objectName || !pod) {
          return {
            disabled: true,
            placeholder: 'Please select an object type first',
            options: []
          };
        }

        try {
          const apiKey = auth as string;
          const baseUrl = `https://api.${pod}.insightly.com/v3.1`;
          
          // Use the correct endpoint for each object type
          let endpoint = objectName;
          if (objectName === 'Products') {
            endpoint = 'Product';
          } else if (objectName === 'Quotation') {
            endpoint = 'Quotation';
          }
          
          const url = `${baseUrl}/${endpoint}?top=100&brief=true`;

          const response = await httpClient.sendRequest({
            method: HttpMethod.GET,
            url,
            headers: {
              'Content-Type': 'application/json'
            },
            authentication: {
              type: AuthenticationType.BASIC,
              username: apiKey,
              password: ''
            }
          });

          const records = Array.isArray(response.body) ? response.body : [];
          
          return {
            options: records.map((record: any) => {
              let recordId: number;
              let recordName: string;
              
              if (objectName === 'Contacts') {
                recordId = record.CONTACT_ID;
                recordName = `${record.FIRST_NAME || ''} ${record.LAST_NAME || ''}`.trim() || `Contact ${recordId}`;
              } else if (objectName === 'Leads') {
                recordId = record.LEAD_ID;
                recordName = `${record.FIRST_NAME || ''} ${record.LAST_NAME || ''}`.trim() || `Lead ${recordId}`;
              } else if (objectName === 'Opportunities') {
                recordId = record.OPPORTUNITY_ID;
                recordName = record.OPPORTUNITY_NAME || `Opportunity ${recordId}`;
              } else if (objectName === 'Organisations') {
                recordId = record.ORGANISATION_ID;
                recordName = record.ORGANISATION_NAME || `Organization ${recordId}`;
              } else if (objectName === 'Projects') {
                recordId = record.PROJECT_ID;
                recordName = record.PROJECT_NAME || `Project ${recordId}`;
              } else if (objectName === 'Tasks') {
                recordId = record.TASK_ID;
                recordName = record.TITLE || `Task ${recordId}`;
              } else if (objectName === 'Events') {
                recordId = record.EVENT_ID;
                recordName = record.TITLE || `Event ${recordId}`;
              } else if (objectName === 'Notes') {
                recordId = record.NOTE_ID;
                recordName = record.TITLE || `Note ${recordId}`;
              } else if (objectName === 'Products') {
                recordId = record.PRODUCT_ID;
                recordName = record.PRODUCT_NAME || `Product ${recordId}`;
              } else if (objectName === 'Quotation') {
                recordId = record.QUOTE_ID;
                recordName = record.QUOTATION_NAME || `Quote ${recordId}`;
              } else {
                recordId = record.RECORD_ID || record.ID;
                recordName = record.RECORD_NAME || record.NAME || `Record ${recordId}`;
              }

              return {
                label: `${recordName} (ID: ${recordId})`,
                value: recordId
              };
            })
          };
        } catch (error: any) {
          return {
            disabled: true,
            placeholder: 'Error loading records. Check your API key and pod.',
            options: []
          };
        }
      }
    }),
    confirmDeletion: Property.Checkbox({
      displayName: 'Confirm Deletion',
      description: 'Check this box to confirm you want to permanently delete this record',
      required: true
    })
  },
  async run(context) {
    const { pod, objectName, recordId, confirmDeletion } = context.propsValue;
    
    if (!confirmDeletion) {
      throw new Error('You must confirm deletion by checking the confirmation box');
    }
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