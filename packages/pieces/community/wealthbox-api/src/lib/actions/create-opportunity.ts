import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod, AuthenticationType } from '@activepieces/pieces-common';

export const createOpportunity = createAction({
  name: 'create_opportunity',
  displayName: 'Create Opportunity',
  description: 'Logs an opportunity including stage, close date, amount',
  props: {
    // Required fields
    name: Property.ShortText({
      displayName: 'Opportunity Name',
      description: 'The name of the opportunity (e.g., "Financial Plan", "Investment Advisory", "Estate Planning")',
      required: true
    }),
    target_close: Property.DateTime({
      displayName: 'Target Close Date',
      description: 'The date/time when the opportunity should close',
      required: true
    }),
    probability: Property.Number({
      displayName: 'Probability (%)',
      description: 'The chance the opportunity will close, as a percentage (0-100)',
      required: true
    }),
    stage: Property.Number({
      displayName: 'Stage ID',
      description: 'The ID representing the current stage the opportunity is in',
      required: true
    }),
    
    // Amount information
    amount: Property.Number({
      displayName: 'Amount',
      description: 'The monetary value of the opportunity',
      required: true
    }),
    currency: Property.StaticDropdown({
      displayName: 'Currency',
      description: 'The currency for the opportunity amount',
      required: false,
      defaultValue: '$',
      options: {
        options: [
          { label: 'USD ($)', value: '$' },
          { label: 'EUR (€)', value: '€' },
          { label: 'GBP (£)', value: '£' },
          { label: 'CAD (C$)', value: 'C$' },
          { label: 'AUD (A$)', value: 'A$' }
        ]
      }
    }),
    amount_kind: Property.StaticDropdown({
      displayName: 'Amount Type',
      description: 'The type of amount this represents',
      required: false,
      defaultValue: 'Fee',
      options: {
        options: [
          { label: 'Fee', value: 'Fee' },
          { label: 'Commission', value: 'Commission' },
          { label: 'Revenue', value: 'Revenue' },
          { label: 'Assets', value: 'Assets' },
          { label: 'Other', value: 'Other' }
        ]
      }
    }),
    
    // Contact linking
    contact_id: Property.Number({
      displayName: 'Contact ID',
      description: 'The ID of the contact linked to this opportunity',
      required: true
    }),
    contact_name: Property.ShortText({
      displayName: 'Contact Name',
      description: 'The name of the contact (for reference)',
      required: false
    }),
    
    // Optional fields
    description: Property.LongText({
      displayName: 'Description',
      description: 'A detailed explanation of the opportunity',
      required: false
    }),
    manager: Property.Number({
      displayName: 'Manager User ID',
      description: 'The ID of the user designated as manager of this opportunity',
      required: false
    }),
    
    // Visibility
    visible_to: Property.StaticDropdown({
      displayName: 'Visible To',
      description: 'Who can view this opportunity',
      required: false,
      defaultValue: 'Everyone',
      options: {
        options: [
          { label: 'Everyone', value: 'Everyone' },
          { label: 'Only Me', value: 'Only Me' },
          { label: 'My Team', value: 'My Team' }
        ]
      }
    }),
    
    // Custom fields
    custom_field_1_id: Property.Number({
      displayName: 'Custom Field 1 ID',
      description: 'ID of the first custom field to set (optional)',
      required: false
    }),
    custom_field_1_value: Property.ShortText({
      displayName: 'Custom Field 1 Value',
      description: 'Value for the first custom field',
      required: false
    }),
    custom_field_2_id: Property.Number({
      displayName: 'Custom Field 2 ID',
      description: 'ID of the second custom field to set (optional)',
      required: false
    }),
    custom_field_2_value: Property.ShortText({
      displayName: 'Custom Field 2 Value',
      description: 'Value for the second custom field',
      required: false
    })
  },
  
  async run(context) {
    const { auth, propsValue } = context;
    
    if (!auth) {
      throw new Error('Authentication is required');
    }
    
    const accessToken = (auth as any).access_token;
    if (!accessToken) {
      throw new Error('Access token not found in authentication');
    }
    
    // Validate probability range
    if (propsValue.probability < 0 || propsValue.probability > 100) {
      throw new Error('Probability must be between 0 and 100');
    }
    
    // Build the request body
    const requestBody: any = {
      name: propsValue.name,
      target_close: propsValue.target_close,
      probability: propsValue.probability,
      stage: propsValue.stage,
      amounts: [
        {
          amount: propsValue.amount,
          currency: propsValue.currency || '$',
          kind: propsValue.amount_kind || 'Fee'
        }
      ],
      linked_to: [
        {
          id: propsValue.contact_id,
          type: 'Contact',
          name: propsValue.contact_name || `Contact ${propsValue.contact_id}`
        }
      ]
    };
    
    // Add optional fields if provided
    if (propsValue.description) {
      requestBody.description = propsValue.description;
    }
    
    if (propsValue.manager) {
      requestBody.manager = propsValue.manager;
    }
    
    if (propsValue.visible_to) {
      requestBody.visible_to = propsValue.visible_to;
    }
    
    // Handle custom fields
    const customFields: any[] = [];
    
    if (propsValue.custom_field_1_id && propsValue.custom_field_1_value) {
      customFields.push({
        id: propsValue.custom_field_1_id,
        value: propsValue.custom_field_1_value
      });
    }
    
    if (propsValue.custom_field_2_id && propsValue.custom_field_2_value) {
      customFields.push({
        id: propsValue.custom_field_2_id,
        value: propsValue.custom_field_2_value
      });
    }
    
    if (customFields.length > 0) {
      requestBody.custom_fields = customFields;
    }
    
    // Make the API request
    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: 'https://api.crmworkspace.com/v1/opportunities',
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: accessToken
        },
        headers: {
          'Content-Type': 'application/json'
        },
        body: requestBody
      });
      
      if (response.status >= 400) {
        throw new Error(`Wealthbox API error: ${response.status} - ${JSON.stringify(response.body)}`);
      }
      
      return response.body;
    } catch (error) {
      throw new Error(`Failed to create opportunity: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
});