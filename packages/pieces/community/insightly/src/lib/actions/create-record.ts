import { propsValidation } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType
} from '@activepieces/pieces-common';
import { insightlyAuth, insightlyCommon } from '../common/common';

export const createRecord = createAction({
  auth: insightlyAuth,
  name: 'create_record',
  displayName: 'Create Record',
  description:
    'Create a new record in a specified Insightly object (Contact, Lead, Opportunity, etc.)',
  props: {
    pod: Property.ShortText({
      displayName: 'Pod',
      description:
        'Your Insightly pod (e.g., "na1", "eu1"). Find this in your API URL: https://api.{pod}.insightly.com',
      required: true
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
    recordName: Property.ShortText({
      displayName: 'Record Name',
      description: 'Name for the new record',
      required: true
    }),
    ownerUserId: Property.Number({
      displayName: 'Owner User ID',
      description: 'ID of the user who will own this record (optional)',
      required: false
    }),
    visibleTo: Property.StaticDropdown({
      displayName: 'Visible To',
      description: 'Who can see this record',
      required: false,
      options: {
        options: [
          { label: 'Everyone', value: 'Everyone' },
          { label: 'Owner', value: 'Owner' },
          { label: 'Team', value: 'Team' }
        ]
      }
    }),
    visibleTeamId: Property.Number({
      displayName: 'Visible Team ID',
      description:
        'ID of the team that can see this record (when Visible To is set to Team)',
      required: false
    }),
    customFields: Property.Object({
      displayName: 'Custom Fields',
      description:
        'Custom fields as key-value pairs. Use the exact FIELD_NAME from your Insightly instance.',
      required: false
    })
  },
  async run(context) {
    // Validate props using ActivePieces built-in validation
    await propsValidation.validateZod(
      context.propsValue,
      insightlyCommon.createRecordSchema
    );

    const {
      pod,
      objectName,
      recordName,
      ownerUserId,
      visibleTo,
      visibleTeamId,
      customFields
    } = context.propsValue;
    const apiKey = context.auth;

    // Build the API URL
    const baseUrl = `https://api.${pod}.insightly.com/v3.1`;
    const url = `${baseUrl}/${objectName}`;

    // Prepare the record data
    const recordData: any = {
      RECORD_NAME: recordName
    };

    // Add optional fields if provided
    if (ownerUserId) {
      recordData.OWNER_USER_ID = ownerUserId;
    }

    if (visibleTo) {
      recordData.VISIBLE_TO = visibleTo;
    }

    if (visibleTeamId) {
      recordData.VISIBLE_TEAM_ID = visibleTeamId;
    }

    // Handle custom fields
    if (customFields && typeof customFields === 'object') {
      recordData.CUSTOMFIELDS = Object.entries(customFields).map(
        ([fieldName, fieldValue]) => ({
          FIELD_NAME: fieldName,
          FIELD_VALUE: fieldValue
        })
      );
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
        throw new Error(
          `Data validation error: ${
            error.response.body?.message || 'Invalid data provided'
          }`
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
