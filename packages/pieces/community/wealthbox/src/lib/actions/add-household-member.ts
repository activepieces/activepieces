import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { fetchContacts, fetchHouseholds, WEALTHBOX_API_BASE, handleApiError } from '../common';

export const addHouseholdMember = createAction({
  name: 'add_household_member',
  displayName: 'Add Member to Household',
  description: 'Adds a member to an existing household. Link multiple contacts under one family unit.',
  props: {
    household_id: Property.Dropdown({
      displayName: 'Household',
      description: 'Select the household that will receive the new member',
      required: true,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) return { options: [] };

        try {
          const households = await fetchHouseholds(auth as unknown as string);
          return {
            options: households.map((household: any) => ({
              label: household.first_name || `Household ${household.id}`,
              value: household.id
            }))
          };
        } catch (error) {
          return {
            options: [],
            error: 'Failed to load households. Please check your authentication.'
          };
        }
      }
    }),
    contact_id: Property.Dropdown({
      displayName: 'Contact',
      description: 'Select the contact to add to the household',
      required: true,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) return { options: [] };

        try {
          const contacts = await fetchContacts(auth as unknown as string, { active: true, order: 'recent' });
          return {
            options: contacts.map((contact: any) => ({
              label: contact.name || `${contact.first_name} ${contact.last_name}`.trim() || `Contact ${contact.id}`,
              value: contact.id
            }))
          };
        } catch (error) {
          return {
            options: [],
            error: 'Failed to load contacts. Please check your authentication.'
          };
        }
      }
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

    const requestBody = {
      id: propsValue.contact_id,
      title: propsValue.title
    };

    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: `${WEALTHBOX_API_BASE}/households/${propsValue.household_id}/members`,
        headers: {
          'ACCESS_TOKEN': auth as unknown as string,
          'Content-Type': 'application/json'
        },
        body: requestBody
      });

      if (response.status >= 400) {
        handleApiError('add household member', response.status, response.body);
      }

      return response.body;
    } catch (error) {
      throw new Error(`Failed to add member to household: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
});