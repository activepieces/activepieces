import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod, AuthenticationType } from '@activepieces/pieces-common';

export const addHouseholdMember = createAction({
  name: 'add_household_member',
  displayName: 'Add Member to Household',
  description: 'Adds a member to an existing household',
  props: {
    // Required fields
    household_id: Property.Number({
      displayName: 'Household ID',
      description: 'The ID of the household that will receive the new member',
      required: true
    }),
    contact_id: Property.Number({
      displayName: 'Contact ID',
      description: 'The ID of the contact to add to the household',
      required: true
    }),
    title: Property.StaticDropdown({
      displayName: 'Household Title',
      description: 'The household title to assign to the added contact',
      required: true,
      options: {
        options: [
          { label: 'Head', value: 'Head' },
          { label: 'Spouse', value: 'Spouse' },
          { label: 'Partner', value: 'Partner' },
          { label: 'Child', value: 'Child' },
          { label: 'Grandchild', value: 'Grandchild' },
          { label: 'Parent', value: 'Parent' },
          { label: 'Grandparent', value: 'Grandparent' },
          { label: 'Sibling', value: 'Sibling' },
          { label: 'Other', value: 'Other' },
          { label: 'Dependent', value: 'Dependent' }
        ]
      }
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
    
    // Build the request body
    const requestBody = {
      id: propsValue.contact_id,
      title: propsValue.title
    };
    
    // Make the API request
    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: `https://api.crmworkspace.com/v1/households/${propsValue.household_id}/members`,
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
      throw new Error(`Failed to add member to household: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
});