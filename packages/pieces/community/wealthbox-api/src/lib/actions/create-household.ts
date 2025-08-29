import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod, AuthenticationType } from '@activepieces/pieces-common';

export const createHousehold = createAction({
  name: 'create_household',
  displayName: 'Create Household',
  description: 'Creates a household record with emails, tags',
  props: {
    // Required fields
    name: Property.ShortText({
      displayName: 'Household Name',
      description: 'The name of the household (e.g., "The Anderson Family", "Smith Household")',
      required: true
    }),
    
    // Initial member (Head of household)
    head_contact_id: Property.Number({
      displayName: 'Head of Household Contact ID',
      description: 'The ID of the contact who will be the head of this household',
      required: false
    }),
    
    // Contact information
    email_address: Property.ShortText({
      displayName: 'Primary Email Address',
      description: 'Primary email address for the household',
      required: false
    }),
    
    // Address information
    street_line_1: Property.ShortText({
      displayName: 'Street Address Line 1',
      description: 'First line of street address',
      required: false
    }),
    street_line_2: Property.ShortText({
      displayName: 'Street Address Line 2',
      description: 'Second line of street address (apt, suite, etc.)',
      required: false
    }),
    city: Property.ShortText({
      displayName: 'City',
      description: 'City for the household address',
      required: false
    }),
    state: Property.ShortText({
      displayName: 'State',
      description: 'State or province for the household address',
      required: false
    }),
    zip_code: Property.ShortText({
      displayName: 'ZIP Code',
      description: 'ZIP or postal code for the household address',
      required: false
    }),
    country: Property.ShortText({
      displayName: 'Country',
      description: 'Country for the household address',
      required: false,
      defaultValue: 'United States'
    }),
    
    // Phone number
    phone_number: Property.ShortText({
      displayName: 'Primary Phone Number',
      description: 'Primary phone number for the household',
      required: false
    }),
    
    // Classification
    type: Property.StaticDropdown({
      displayName: 'Household Type',
      description: 'The type of household being created',
      required: false,
      defaultValue: 'Household',
      options: {
        options: [
          { label: 'Household', value: 'Household' },
          { label: 'Organization', value: 'Organization' },
          { label: 'Trust', value: 'Trust' }
        ]
      }
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      description: 'Whether the household is currently active',
      required: false,
      defaultValue: 'Active',
      options: {
        options: [
          { label: 'Active', value: 'Active' },
          { label: 'Inactive', value: 'Inactive' }
        ]
      }
    }),
    
    // Additional information
    background_information: Property.LongText({
      displayName: 'Background Information',
      description: 'Background information about the household',
      required: false
    }),
    important_information: Property.LongText({
      displayName: 'Important Information',
      description: 'Any important information about the household',
      required: false
    }),
    
    // Tags
    tags: Property.Array({
      displayName: 'Tags',
      description: 'Tags to associate with the household (e.g., "High Net Worth", "Family", "Trust")',
      required: false
    }),
    
    // Visibility
    visible_to: Property.StaticDropdown({
      displayName: 'Visible To',
      description: 'Who can view this household',
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
    
    // External ID for integrations
    external_unique_id: Property.ShortText({
      displayName: 'External Unique ID',
      description: 'A unique identifier for this household in an external system',
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
    
    // Build the request body - creating as a contact with type "Household"
    const requestBody: any = {
      first_name: propsValue.name,
      last_name: '', // Households typically don't have last names
      type: propsValue.type || 'Household'
    };
    
    // Add optional fields if provided
    if (propsValue.status) requestBody.status = propsValue.status;
    if (propsValue.background_information) requestBody.background_information = propsValue.background_information;
    if (propsValue.important_information) requestBody.important_information = propsValue.important_information;
    if (propsValue.visible_to) requestBody.visible_to = propsValue.visible_to;
    if (propsValue.external_unique_id) requestBody.external_unique_id = propsValue.external_unique_id;
    
    // Handle email address
    if (propsValue.email_address) {
      requestBody.email_addresses = [{
        address: propsValue.email_address,
        principal: true,
        kind: 'Work'
      }];
    }
    
    // Handle phone number
    if (propsValue.phone_number) {
      requestBody.phone_numbers = [{
        address: propsValue.phone_number,
        principal: true,
        kind: 'Work'
      }];
    }
    
    // Handle address
    if (propsValue.street_line_1 || propsValue.city || propsValue.state || propsValue.zip_code) {
      requestBody.street_addresses = [{
        street_line_1: propsValue.street_line_1 || '',
        street_line_2: propsValue.street_line_2 || '',
        city: propsValue.city || '',
        state: propsValue.state || '',
        zip_code: propsValue.zip_code || '',
        country: propsValue.country || 'United States',
        principal: true,
        kind: 'Work'
      }];
    }
    
    // Handle tags
    if (propsValue.tags && Array.isArray(propsValue.tags) && propsValue.tags.length > 0) {
      requestBody.tags = propsValue.tags;
    }
    
    // Handle initial household member (head)
    if (propsValue.head_contact_id) {
      requestBody.household = {
        name: propsValue.name,
        title: 'Head'
      };
    }
    
    // Make the API request to create the household as a contact
    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: 'https://api.crmworkspace.com/v1/contacts',
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
      
      const householdContact = response.body;
      
      // If a head contact was specified, add them to the household
      if (propsValue.head_contact_id && householdContact.id) {
        try {
          const memberResponse = await httpClient.sendRequest({
            method: HttpMethod.POST,
            url: `https://api.crmworkspace.com/v1/households/${householdContact.id}/members`,
            authentication: {
              type: AuthenticationType.BEARER_TOKEN,
              token: accessToken
            },
            headers: {
              'Content-Type': 'application/json'
            },
            body: {
              id: propsValue.head_contact_id,
              title: 'Head'
            }
          });
          
          if (memberResponse.status < 400) {
            // Return the household with members
            return {
              household: householdContact,
              members: memberResponse.body.members || []
            };
          }
        } catch (memberError) {
          // If adding member fails, still return the created household
          console.warn('Failed to add head of household member:', memberError);
        }
      }
      
      return householdContact;
    } catch (error) {
      throw new Error(`Failed to create household: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
});