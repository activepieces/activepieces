import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { fetchContacts, fetchUsers, fetchUserGroups, fetchEventCategories, fetchCustomFields, WEALTHBOX_API_BASE, handleApiError, DOCUMENT_TYPES, EVENT_STATES } from '../common';

export const createEvent = createAction({
  name: 'create_event',
  displayName: 'Create Event',
  description: 'Creates a calendar event linked to contact. Schedule advisory meetings on behalf of clients.',
  props: {
    title: Property.ShortText({
      displayName: 'Event Title',
      description: 'The name of the event (e.g., "Client Meeting", "Portfolio Review")',
      required: true
    }),
    starts_at: Property.DateTime({
      displayName: 'Start Date & Time',
      description: 'When the event starts (yyyy-mm-dd hh:mm format)',
      required: true
    }),
    ends_at: Property.DateTime({
      displayName: 'End Date & Time',
      description: 'When the event ends (yyyy-mm-dd hh:mm format)',
      required: true
    }),

    location: Property.ShortText({
      displayName: 'Location',
      description: 'Where the event takes place (e.g., "Conference Room", "Client Office", "Zoom Meeting")',
      required: false
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'A detailed explanation of the event purpose and agenda',
      required: false
    }),

    all_day: Property.Checkbox({
      displayName: 'All Day Event',
      description: 'Check if this is an all-day event',
      required: false,
      defaultValue: false
    }),
    repeats: Property.Checkbox({
      displayName: 'Repeating Event',
      description: 'Check if this event repeats',
      required: false,
      defaultValue: false
    }),

    state: Property.StaticDropdown({
      displayName: 'Event Status',
      description: 'The current state of the event',
      required: false,
      defaultValue: EVENT_STATES.UNCONFIRMED,
      options: {
        options: [
          { label: 'Unconfirmed', value: EVENT_STATES.UNCONFIRMED },
          { label: 'Confirmed', value: EVENT_STATES.CONFIRMED },
          { label: 'Tentative', value: EVENT_STATES.TENTATIVE },
          { label: 'Completed', value: EVENT_STATES.COMPLETED },
          { label: 'Cancelled', value: EVENT_STATES.CANCELLED }
        ]
      }
    }),

    contact_id: Property.Dropdown({
      displayName: 'Linked Contact',
      description: 'Select the contact to link this event to',
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

    invitees: Property.DynamicProperties({
      displayName: 'Invitees',
      description: 'Add people to invite to this event',
      required: false,
      refreshers: [],
      props: async ({ auth }) => {
        if (!auth) {
          return {
            invitees_array: Property.Array({
              displayName: 'Invitees',
              description: 'Add invitees to this event',
              required: false,
              properties: {
                invitee: Property.ShortText({
                  displayName: 'Invitee',
                  description: 'Invitee name',
                  required: true
                }),
                type: Property.StaticDropdown({
                  displayName: 'Type',
                  description: 'Type of invitee',
                  required: true,
                  options: {
                    options: [
                      { label: 'Contact', value: 'Contact' },
                      { label: 'User', value: 'User' }
                    ]
                  }
                })
              }
            })
          };
        }

        try {
          const [contacts, users] = await Promise.all([
            fetchContacts(auth as unknown as string, { active: true }),
            fetchUsers(auth as unknown as string)
          ]);

          const contactOptions = contacts.map((contact: any) => ({
            label: `${contact.name || `${contact.first_name} ${contact.last_name}`.trim()} (Contact)`,
            value: `contact_${contact.id}`
          }));

          const userOptions = users.map((user: any) => ({
            label: `${user.name} (User)`,
            value: `user_${user.id}`
          }));

          const allInviteeOptions = [...contactOptions, ...userOptions];

          return {
            invitees_array: Property.Array({
              displayName: 'Invitees',
              description: 'Add invitees to this event',
              required: false,
              properties: {
                invitee: Property.StaticDropdown({
                  displayName: 'Invitee',
                  description: 'Select a contact or user to invite',
                  required: true,
                  options: {
                    options: allInviteeOptions
                  }
                })
              }
            })
          };
        } catch (error) {
          return {
            invitees_array: Property.Array({
              displayName: 'Invitees',
              description: 'Add invitees to this event (API unavailable)',
              required: false,
              properties: {
                invitee: Property.ShortText({
                  displayName: 'Invitee Name',
                  description: 'Enter the invitee name',
                  required: true
                }),
                type: Property.StaticDropdown({
                  displayName: 'Type',
                  description: 'Type of invitee',
                  required: true,
                  options: {
                    options: [
                      { label: 'Contact', value: 'Contact' },
                      { label: 'User', value: 'User' }
                    ]
                  }
                })
              }
            })
          };
        }
      }
    }),

    event_category: Property.Dropdown({
      displayName: 'Event Category',
      description: 'Select the category for this event',
      required: false,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) return { options: [] };

        try {
          const categories = await fetchEventCategories(auth as unknown as string);
          return {
            options: categories.map((category: any) => ({
              label: category.name,
              value: category.id
            }))
          };
        } catch (error) {
          return {
            options: [],
            error: 'Failed to load event categories. Please check your authentication.'
          };
        }
      }
    }),

    email_invitees: Property.Checkbox({
      displayName: 'Email Invitees',
      description: 'Send email invitations to invitees',
      required: false,
      defaultValue: true
    }),

    visible_to: Property.Dropdown({
      displayName: 'Visible To',
      description: 'Select who can view this event',
      required: false,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) return { options: [] };

        try {
          const userGroups = await fetchUserGroups(auth as unknown as string);
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

    custom_fields: Property.DynamicProperties({
      displayName: 'Custom Fields',
      description: 'Add custom fields to this event',
      required: false,
      refreshers: [],
      props: async ({ auth }) => {
        if (!auth) {
          return {
            custom_fields_array: Property.Array({
              displayName: 'Custom Fields',
              description: 'Add custom fields to this event',
              required: false,
              properties: {
                custom_field: Property.ShortText({
                  displayName: 'Custom Field',
                  description: 'Custom field name',
                  required: true
                }),
                value: Property.ShortText({
                  displayName: 'Value',
                  description: 'The value for this custom field',
                  required: true
                })
              }
            })
          };
        }

        try {
          const customFields = await fetchCustomFields(auth as unknown as string, DOCUMENT_TYPES.EVENT);
          const customFieldOptions = customFields.map((field: any) => ({
            label: field.name,
            value: field.name
          }));

          return {
            custom_fields_array: Property.Array({
              displayName: 'Custom Fields',
              description: 'Add custom fields to this event',
              required: false,
              properties: {
                custom_field: Property.StaticDropdown({
                  displayName: 'Custom Field',
                  description: 'Select a custom field for this event',
                  required: true,
                  options: {
                    options: customFieldOptions
                  }
                }),
                value: Property.ShortText({
                  displayName: 'Value',
                  description: 'The value for this custom field',
                  required: true
                })
              }
            })
          };
        } catch (error) {
          return {
            custom_fields_array: Property.Array({
              displayName: 'Custom Fields',
              description: 'Add custom fields to this event (API unavailable)',
              required: false,
              properties: {
                custom_field: Property.ShortText({
                  displayName: 'Custom Field Name',
                  description: 'Enter the custom field name exactly',
                  required: true
                }),
                value: Property.ShortText({
                  displayName: 'Value',
                  description: 'The value for this custom field',
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

    const requestBody: any = {
      title: propsValue.title,
      starts_at: propsValue.starts_at,
      ends_at: propsValue.ends_at
    };

    if (propsValue.location) requestBody.location = propsValue.location;
    if (propsValue.description) requestBody.description = propsValue.description;
    if (propsValue.all_day !== undefined) requestBody.all_day = propsValue.all_day;
    if (propsValue.repeats !== undefined) requestBody.repeats = propsValue.repeats;
    if (propsValue.state) requestBody.state = propsValue.state;
    if (propsValue.event_category) requestBody.event_category = propsValue.event_category;
    if (propsValue.visible_to) requestBody.visible_to = propsValue.visible_to;
    if (propsValue.email_invitees !== undefined) requestBody.email_invitees = propsValue.email_invitees;

    if (propsValue.contact_id) {
      try {
        const contacts = await fetchContacts(auth as unknown as string, { active: true });
        const selectedContact = contacts.find((contact: any) => contact.id === propsValue.contact_id);

        requestBody.linked_to = [{
          id: propsValue.contact_id,
          type: 'Contact',
          name: selectedContact ? (selectedContact.name || `${selectedContact.first_name} ${selectedContact.last_name}`.trim()) : `Contact ${propsValue.contact_id}`
        }];
      } catch (error) {
        requestBody.linked_to = [{
          id: propsValue.contact_id,
          type: 'Contact',
          name: `Contact ${propsValue.contact_id}`
        }];
      }
    }

    const inviteesArray = (propsValue as any).invitees_array;
    if (inviteesArray && Array.isArray(inviteesArray) && inviteesArray.length > 0) {
      const invitees: any[] = [];

      for (const inviteeItem of inviteesArray) {
        const inviteeValue = inviteeItem.invitee;

        if (inviteeValue && typeof inviteeValue === 'string') {
          if (inviteeValue.startsWith('contact_')) {
            const contactId = inviteeValue.replace('contact_', '');
            invitees.push({
              id: parseInt(contactId),
              type: 'Contact'
            });
          } else if (inviteeValue.startsWith('user_')) {
            const userId = inviteeValue.replace('user_', '');
            invitees.push({
              id: parseInt(userId),
              type: 'User'
            });
          }
        }
      }

      if (invitees.length > 0) {
        requestBody.invitees = invitees;
      }
    }

    const customFieldsArray = (propsValue as any).custom_fields_array;
    if (customFieldsArray && Array.isArray(customFieldsArray) && customFieldsArray.length > 0) {
      try {
        const customFields = await fetchCustomFields(auth as unknown as string, DOCUMENT_TYPES.EVENT);
        const customFieldMap = new Map(customFields.map((field: any) => [field.name, field.id]));

        requestBody.custom_fields = customFieldsArray.map((field: any) => {
          const fieldId = customFieldMap.get(field.custom_field);
          if (!fieldId) {
            throw new Error(`Custom field "${field.custom_field}" not found. Please check the field name.`);
          }
          return {
            id: fieldId,
            value: field.value
          };
        });
      } catch (error) {
        if (error instanceof Error && error.message.includes('Custom field')) {
          throw error;
        }
        console.warn('Could not fetch custom fields for validation:', error);
        requestBody.custom_fields = customFieldsArray.map((field: any) => ({
          id: field.custom_field,
          value: field.value
        }));
      }
    }

    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: `${WEALTHBOX_API_BASE}/events`,
        headers: {
          'ACCESS_TOKEN': auth as unknown as string,
          'Content-Type': 'application/json'
        },
        body: requestBody
      });

      if (response.status >= 400) {
        handleApiError('create event', response.status, response.body);
      }

      return response.body;
    } catch (error) {
      throw new Error(`Failed to create event: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
});