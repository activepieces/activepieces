import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { fetchUserGroups, fetchContacts, fetchTags, WEALTHBOX_API_BASE, handleApiError, DOCUMENT_TYPES } from '../common';

export const createNote = createAction({
  name: 'create_note',
  displayName: 'Create Note',
  description: 'Adds a note linked to a contact. Log call summaries against client records.',
  props: {
    content: Property.LongText({
      displayName: 'Note Content',
      description: 'The main body of the note (e.g., call summary, meeting notes, client interaction details)',
      required: true
    }),

    contact_id: Property.Dropdown({
      displayName: 'Contact',
      description: 'Select the contact to link this note to',
      required: true,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) return { options: [] };

        try {
          const contacts = await fetchContacts(auth as string, { active: true, order: 'recent' });
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

    visible_to: Property.Dropdown({
      displayName: 'Visible To',
      description: 'Select who can view this note',
      required: false,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) return { options: [] };

        try {
          const userGroups = await fetchUserGroups(auth as string);
          return {
            options: userGroups.map((group: any) => ({
              label: group.name,
              value: group.name
            }))
          };
        } catch (error) {
          return {
            options: [],
            error: 'Failed to load user groups. Please check your authentication.'
          };
        }
      }
    }),

    tags: Property.DynamicProperties({
      displayName: 'Tags',
      description: 'Select tags to associate with this note',
      required: false,
      refreshers: [],
      props: async ({ auth }) => {
        if (!auth) {
          return {
            tags_array: Property.Array({
              displayName: 'Tags',
              description: 'Add tags to this note',
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
          const tags = await fetchTags(auth as unknown as string, DOCUMENT_TYPES.CONTACT_NOTE);
          const tagOptions = tags.map((tag: any) => ({
            label: tag.name,
            value: tag.name
          }));

          return {
            tags_array: Property.Array({
              displayName: 'Tags',
              description: 'Add tags to this note',
              required: false,
              properties: {
                tag: Property.StaticDropdown({
                  displayName: 'Tag',
                  description: 'Select a tag for this note',
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
              description: 'Add tags to this note (API unavailable)',
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
    })
  },
  
  async run(context) {
    const { auth, propsValue } = context;
    
    if (!auth) {
      throw new Error('Authentication is required');
    }
    

    
    const linkedToResource: any = {
      id: propsValue.contact_id,
      type: 'Contact'
    };

    try {
      const contacts = await fetchContacts(auth as string, { active: true });
      const selectedContact = contacts.find((contact: any) => contact.id === propsValue.contact_id);
      if (selectedContact) {
        linkedToResource.name = selectedContact.name || `${selectedContact.first_name} ${selectedContact.last_name}`.trim();
      }
    } catch (error) {
      console.warn('Could not fetch contact name for reference:', error);
    }

    const requestBody: any = {
      content: propsValue.content,
      linked_to: [linkedToResource]
    };

    if (propsValue.visible_to) {
      requestBody.visible_to = propsValue.visible_to;
    }

    const tagsArray = (propsValue as any).tags_array;
    if (tagsArray && Array.isArray(tagsArray) && tagsArray.length > 0) {
      requestBody.tags = tagsArray.map((tagItem: any) => tagItem.tag);
    }
    
    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: `${WEALTHBOX_API_BASE}/notes`,
        headers: {
          'ACCESS_TOKEN': auth as string,
          'Content-Type': 'application/json'
        },
        body: requestBody
      });

      if (response.status >= 400) {
        handleApiError('create note', response.status, response.body);
      }
      
      return response.body;
    } catch (error) {
      throw new Error(`Failed to create note: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
});