import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { fetchContacts, fetchUserGroups, fetchTags, WEALTHBOX_API_BASE, handleApiError, DOCUMENT_TYPES } from '../common';

export const createHousehold = createAction({
  name: 'create_household',
  displayName: 'Create Household',
  description: 'Creates a household record with emails, tags. Group family member contacts into one household.',
  props: {
    name: Property.ShortText({
      displayName: 'Household Name',
      description: 'The name of the household (e.g., "The Anderson Family", "Smith Household")',
      required: true
    }),

    head_contact_id: Property.Dropdown({
      displayName: 'Head of Household',
      description: 'Select the contact who will be the head of this household',
      required: false,
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

    spouse_contact_id: Property.Dropdown({
      displayName: 'Spouse/Partner (Optional)',
      description: 'Select the spouse or partner to automatically add to this household',
      required: false,
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
    
    email_address: Property.ShortText({
      displayName: 'Primary Email Address',
      description: 'Primary email address for the household',
      required: false
    }),
    
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
    
    phone_number: Property.ShortText({
      displayName: 'Primary Phone Number',
      description: 'Primary phone number for the household',
      required: false
    }),
    
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
    
    tags: Property.DynamicProperties({
      displayName: 'Tags',
      description: 'Select tags to associate with this household',
      required: false,
      refreshers: [],
      props: async ({ auth }) => {
        if (!auth) {
          return {
            tags_array: Property.Array({
              displayName: 'Tags',
              description: 'Add tags to this household',
              required: false,
              properties: {
                tag: Property.ShortText({
                  displayName: 'Tag',
                  description: 'Tag name',
                  required: true
                })
              }
            })
          };
        }

        try {
          const tags = await fetchTags(auth as unknown as string, DOCUMENT_TYPES.CONTACT);
          const tagOptions = tags.map((tag: any) => ({
            label: tag.name,
            value: tag.name
          }));

          return {
            tags_array: Property.Array({
              displayName: 'Tags',
              description: 'Add tags to this household',
              required: false,
              properties: {
                tag: Property.StaticDropdown({
                  displayName: 'Tag',
                  description: 'Select a tag for this household',
                  required: true,
                  options: {
                    options: tagOptions
                  }
                })
              }
            })
          };
        } catch (error) {
          return {
            tags_array: Property.Array({
              displayName: 'Tags',
              description: 'Add tags to this household (API unavailable)',
              required: false,
              properties: {
                tag: Property.ShortText({
                  displayName: 'Tag Name',
                  description: 'Enter the tag name exactly',
                  required: true
                })
              }
            })
          };
        }
      }
    }),

          visible_to: Property.Dropdown({
        displayName: 'Visible To',
        description: 'Select who can view this household',
        required: false,
        refreshers: [],
        options: async ({ auth }) => {
          if (!auth) return { options: [] };

          try {
            const userGroups = await fetchUserGroups(auth as unknown as string);

            const filteredGroups = userGroups.filter((group: any) => group.name !== 'Only Me');

            return {
              options: filteredGroups.map((group: any) => {
                const displayName = group.user ? `${group.name} (${group.user.name || group.user.email})` : group.name;
                return {
                  label: displayName,
                  value: group.name
                };
              })
            };
          } catch (error) {
            return {
              options: [],
              error: 'Failed to load user groups. Please check your authentication.'
            };
          }
        }
      }),
    
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

    const requestBody: any = {
      name: propsValue.name,
      type: 'Household',
      status: propsValue.status || 'Active'
    };

    if (propsValue.background_information) requestBody.background_information = propsValue.background_information;
    if (propsValue.important_information) requestBody.important_information = propsValue.important_information;

    if (propsValue.visible_to && propsValue.visible_to.trim() !== '') {
      requestBody.visible_to = propsValue.visible_to;
    }

    if (propsValue.external_unique_id) requestBody.external_unique_id = propsValue.external_unique_id;

    if (propsValue.email_address) {
      requestBody.email_addresses = [{
        address: propsValue.email_address,
        principal: true,
        kind: 'Work'
      }];
    }

    if (propsValue.phone_number) {
      requestBody.phone_numbers = [{
        address: propsValue.phone_number,
        principal: true,
        kind: 'Work'
      }];
    }

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

    const tagsArray = (propsValue as any).tags_array;
    if (tagsArray && Array.isArray(tagsArray) && tagsArray.length > 0) {
      requestBody.tags = tagsArray.map((tagItem: any) => tagItem.tag);
    }
    

    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: `${WEALTHBOX_API_BASE}/contacts`,
        headers: {
          'ACCESS_TOKEN': auth as unknown as string,
          'Content-Type': 'application/json'
        },
        body: requestBody
      });

      if (response.status >= 400) {
        handleApiError('create household', response.status, response.body);
      }

      const householdContact = response.body;

      const members: any[] = [];

      if (propsValue.head_contact_id && householdContact.id) {
        try {
          const memberResponse = await httpClient.sendRequest({
            method: HttpMethod.POST,
            url: `${WEALTHBOX_API_BASE}/households/${householdContact.id}/members`,
            headers: {
              'ACCESS_TOKEN': auth as unknown as string,
              'Content-Type': 'application/json'
            },
            body: {
              id: propsValue.head_contact_id,
              title: 'Head'
            }
          });

          if (memberResponse.status < 400) {
            members.push(memberResponse.body);
          }
        } catch (memberError) {
          console.warn('Failed to add head of household member:', memberError);
        }
      }

      if (propsValue.spouse_contact_id && householdContact.id) {
        try {
          const spouseResponse = await httpClient.sendRequest({
            method: HttpMethod.POST,
            url: `${WEALTHBOX_API_BASE}/households/${householdContact.id}/members`,
            headers: {
              'ACCESS_TOKEN': auth as unknown as string,
              'Content-Type': 'application/json'
            },
            body: {
              id: propsValue.spouse_contact_id,
              title: 'Spouse'
            }
          });

          if (spouseResponse.status < 400) {
            members.push(spouseResponse.body);
          }
        } catch (spouseError) {
          console.warn('Failed to add spouse/partner member:', spouseError);
        }
      }

      if (members.length > 0) {
        return {
          household: householdContact,
          members: members
        };
      }

      return householdContact;
    } catch (error) {
      throw new Error(`Failed to create household: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
});