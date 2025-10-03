import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType
} from '@activepieces/pieces-common';
import { insightlyAuth } from '../common/common';

export const createRecord = createAction({
  auth: insightlyAuth,
  name: 'create_record',
  displayName: 'Create Record',
  description:
    'Create a new record in a specified Insightly object (Contact, Lead, Opportunity, etc.)',
  props: {
    pod: Property.ShortText({
      displayName: 'Pod',
      description: 'Your Insightly pod (e.g., "na1", "eu1"). Find this in your API URL: https://api.{pod}.insightly.com',
      required: true,
      defaultValue: 'na1'
    }),
    objectName: Property.StaticDropdown({
      displayName: 'Object Type',
      description: 'Select the type of record to create',
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
    fieldValues: Property.Object({
      displayName: 'Field Values',
      description: 'The record to add (JSON object). Examples by type:\n• Contacts: FIRST_NAME, LAST_NAME, EMAIL_ADDRESS, PHONE_NUMBER\n• Leads: FIRST_NAME, LAST_NAME, EMAIL, LEAD_SOURCE_ID, LEAD_STATUS_ID\n• Opportunities: OPPORTUNITY_NAME, BID_AMOUNT, PROBABILITY, FORECAST_CLOSE_DATE\n• Organizations: ORGANISATION_NAME, PHONE, WEBSITE\n• Projects: PROJECT_NAME, STATUS, PROJECT_DETAILS\n• Tasks: TITLE, DUE_DATE, PRIORITY, OWNER_USER_ID\n• Events: TITLE, START_DATE_UTC, END_DATE_UTC\n• Notes: TITLE, BODY\n• Products: PRODUCT_NAME, DEFAULT_PRICE, ACTIVE\n• Quotes: QUOTATION_NAME, OPPORTUNITY_ID, CONTACT_ID',
      required: true
    })
  },
  async run(context) {
    const { pod, objectName, fieldValues } = context.propsValue;
    const apiKey = context.auth;

    // Build the API URL
    const baseUrl = `https://api.${pod}.insightly.com/v3.1`;
    const url = `${baseUrl}/${objectName}`;

    // Use the provided field values as the record data
    const recordData = { ...fieldValues };

    // Ensure we have data to create
    if (!recordData || Object.keys(recordData).length === 0) {
      throw new Error('Field values must be provided to create the record');
    }

    try {
      // Make the API request
      const response = await httpClient.sendRequest({
        method: HttpMethod.POST,
        url,
        headers: {
          'Content-Type': 'application/json'
        },
        authentication: {
          type: AuthenticationType.BASIC,
          username: apiKey,
          password: '' // Insightly uses API key as username with blank password
        },
        body: recordData
      });

      return {
        success: true,
        recordId: response.body.RECORD_ID,
        recordName: response.body.RECORD_NAME,
        dateCreated: response.body.DATE_CREATED_UTC,
        data: response.body
      };
    } catch (error: any) {
      // Handle specific error cases
      if (error.response?.status === 400) {
        const errorMessage = error.response.body?.message || error.response.body?.error || 'Invalid data provided';
        const errorDetails = error.response.body ? JSON.stringify(error.response.body, null, 2) : 'No details available';
        throw new Error(
          `Data validation error for ${objectName}: ${errorMessage}. ` +
          `Sent data: ${JSON.stringify(recordData, null, 2)}. ` +
          `API response: ${errorDetails}`
        );
      } else if (error.response?.status === 401) {
        throw new Error(
          'Authentication failed. Please check your API key and pod.'
        );
      } else if (error.response?.status === 402) {
        throw new Error('Record limit reached for your Insightly plan.');
      } else {
        throw new Error(`Failed to create record: ${error.message}`);
      }
    }
  }
});
