import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { fetchContacts, fetchUsers, fetchUserGroups, fetchOpportunityStages, fetchCustomFields, WEALTHBOX_API_BASE, handleApiError, DOCUMENT_TYPES, OPPORTUNITY_AMOUNT_KINDS, CURRENCIES } from '../common';

export const createOpportunity = createAction({
  name: 'create_opportunity',
  displayName: 'Create Opportunity',
  description: 'Logs an opportunity including stage, close date, amount. Automate opportunity tracking after meetings.',
  props: {
    name: Property.ShortText({
      displayName: 'Opportunity Name',
      description: 'The name of the opportunity (e.g., "Financial Plan", "Investment Advisory", "Estate Planning")',
      required: true
    }),
    target_close: Property.DateTime({
      displayName: 'Target Close Date',
      description: 'When the opportunity should close',
      required: true
    }),
    probability: Property.Number({
      displayName: 'Probability (%)',
      description: 'The chance the opportunity will close, as a percentage (0-100)',
      required: true
    }),

    amount: Property.Number({
      displayName: 'Amount',
      description: 'The monetary value of the opportunity',
      required: true
    }),
    currency: Property.StaticDropdown({
      displayName: 'Currency',
      description: 'The currency for the opportunity amount',
      required: false,
      defaultValue: CURRENCIES.USD,
      options: {
        options: [
          { label: 'USD ($)', value: CURRENCIES.USD },
          { label: 'EUR (€)', value: CURRENCIES.EUR },
          { label: 'GBP (£)', value: CURRENCIES.GBP },
          { label: 'CAD (C$)', value: CURRENCIES.CAD },
          { label: 'AUD (A$)', value: CURRENCIES.AUD }
        ]
      }
    }),
    amount_kind: Property.StaticDropdown({
      displayName: 'Amount Type',
      description: 'The type of amount this represents',
      required: false,
      defaultValue: OPPORTUNITY_AMOUNT_KINDS.FEE,
      options: {
        options: [
          { label: 'Fee', value: OPPORTUNITY_AMOUNT_KINDS.FEE },
          { label: 'Commission', value: OPPORTUNITY_AMOUNT_KINDS.COMMISSION },
          { label: 'AUM', value: OPPORTUNITY_AMOUNT_KINDS.AUM },
          { label: 'Other', value: OPPORTUNITY_AMOUNT_KINDS.OTHER }
        ]
      }
    }),

    stage: Property.Dropdown({
      displayName: 'Stage',
      description: 'Select the current stage of this opportunity',
      required: true,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) return { options: [] };

        try {
          const stages = await fetchOpportunityStages(auth as unknown as string);
          return {
            options: stages.map((stage: any) => ({
              label: stage.name,
              value: stage.id
            }))
          };
        } catch (error) {
          return {
            options: [],
            error: 'Failed to load opportunity stages. Please check your authentication.'
          };
        }
      }
    }),

    contact_id: Property.Dropdown({
      displayName: 'Linked Contact',
      description: 'Select the contact linked to this opportunity',
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

    description: Property.LongText({
      displayName: 'Description',
      description: 'A detailed explanation of the opportunity',
      required: false
    }),

    manager: Property.Dropdown({
      displayName: 'Opportunity Manager',
      description: 'Select the user designated as manager of this opportunity',
      required: false,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) return { options: [] };

        try {
          const users = await fetchUsers(auth as unknown as string);
          const assignableUsers = users.filter((user: any) => !user.excluded_from_assignments);
          return {
            options: assignableUsers.map((user: any) => ({
              label: `${user.name} (${user.email})`,
              value: user.id
            }))
          };
        } catch (error) {
          return {
            options: [],
            error: 'Failed to load users. Please check your authentication.'
          };
        }
      }
    }),

    visible_to: Property.Dropdown({
      displayName: 'Visible To',
      description: 'Select who can view this opportunity',
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
      description: 'Add custom fields to this opportunity',
      required: false,
      refreshers: [],
      props: async ({ auth }) => {
        if (!auth) {
          return {
            custom_fields_array: Property.Array({
              displayName: 'Custom Fields',
              description: 'Add custom fields to this opportunity',
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
          const customFields = await fetchCustomFields(auth as unknown as string, DOCUMENT_TYPES.OPPORTUNITY);
          const customFieldOptions = customFields.map((field: any) => ({
            label: field.name,
            value: field.name
          }));

          return {
            custom_fields_array: Property.Array({
              displayName: 'Custom Fields',
              description: 'Add custom fields to this opportunity',
              required: false,
              properties: {
                custom_field: Property.StaticDropdown({
                  displayName: 'Custom Field',
                  description: 'Select a custom field for this opportunity',
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
              description: 'Add custom fields to this opportunity (API unavailable)',
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

    if (propsValue.probability < 0 || propsValue.probability > 100) {
      throw new Error('Probability must be between 0 and 100');
    }

    const requestBody: any = {
      name: propsValue.name,
      target_close: propsValue.target_close,
      probability: propsValue.probability,
      stage: propsValue.stage,
      amounts: [
        {
          amount: propsValue.amount,
          currency: propsValue.currency || CURRENCIES.USD,
          kind: propsValue.amount_kind || OPPORTUNITY_AMOUNT_KINDS.FEE
        }
      ]
    };

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

    if (propsValue.description) {
      requestBody.description = propsValue.description;
    }

    if (propsValue.manager) {
      requestBody.manager = propsValue.manager;
    }

    if (propsValue.visible_to) {
      requestBody.visible_to = propsValue.visible_to;
    }

    const customFieldsArray = (propsValue as any).custom_fields_array;
    if (customFieldsArray && Array.isArray(customFieldsArray) && customFieldsArray.length > 0) {
      try {
        const customFields = await fetchCustomFields(auth as unknown as string, DOCUMENT_TYPES.OPPORTUNITY);
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
        url: `${WEALTHBOX_API_BASE}/opportunities`,
        headers: {
          ACCESS_TOKEN: auth as unknown as string,
          'Content-Type': 'application/json'
        },
        body: requestBody
      });

      if (response.status >= 400) {
        handleApiError('create opportunity', response.status, response.body);
      }

      return response.body;
    } catch (error) {
      throw new Error(`Failed to create opportunity: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
});
