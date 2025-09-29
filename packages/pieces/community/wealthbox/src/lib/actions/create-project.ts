import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { fetchUserGroups, fetchUsers, fetchCustomFields, WEALTHBOX_API_BASE, handleApiError, DOCUMENT_TYPES } from '../common';

export const createProject = createAction({
  name: 'create_project',
  displayName: 'Create Project',
  description: 'Starts a new project with description and organizer. Launch project-based onboarding when new clients sign up.',
  props: {
    name: Property.ShortText({
      displayName: 'Project Name',
      description: 'The name of the project (e.g., "Client Onboarding", "Q1 Review Process")',
      required: true
    }),
    description: Property.LongText({
      displayName: 'Project Description',
      description: 'A detailed explanation of the project goals and scope',
      required: true
    }),

    organizer: Property.Dropdown({
      displayName: 'Organizer',
      description: 'Select the user who will be responsible for organizing this project',
      required: false,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) return { options: [] };

        try {
          const users = await fetchUsers(auth as string);
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
      description: 'Select who can view this project',
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

    custom_fields: Property.DynamicProperties({
      displayName: 'Custom Fields',
      description: 'Add custom fields to this project',
      required: false,
      refreshers: [],
      props: async ({ auth }) => {
        if (!auth) {
          return {
            custom_fields_array: Property.Array({
              displayName: 'Custom Fields',
              description: 'Add custom fields to this project',
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
          const customFields = await fetchCustomFields(auth as unknown as string, DOCUMENT_TYPES.PROJECT);
          const customFieldOptions = customFields.map((field: any) => ({
            label: field.name,
            value: field.name
          }));

          return {
            custom_fields_array: Property.Array({
              displayName: 'Custom Fields',
              description: 'Add custom fields to this project',
              required: false,
              properties: {
                custom_field: Property.StaticDropdown({
                  displayName: 'Custom Field',
                  description: 'Select a custom field for this project',
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
              description: 'Add custom fields to this project (API unavailable)',
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
      name: propsValue.name,
      description: propsValue.description
    };
    
    if (propsValue.organizer) {
      requestBody.organizer = propsValue.organizer;
    }
    
    if (propsValue.visible_to) {
      requestBody.visible_to = propsValue.visible_to;
    }
    
    const customFieldsArray = (propsValue as any).custom_fields_array;
    if (customFieldsArray && Array.isArray(customFieldsArray) && customFieldsArray.length > 0) {
      try {
        const customFields = await fetchCustomFields(auth as unknown as string, DOCUMENT_TYPES.PROJECT);
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
        url: `${WEALTHBOX_API_BASE}/projects`,
        headers: {
          'ACCESS_TOKEN': auth as string,
          'Content-Type': 'application/json'
        },
        body: requestBody
      });

      if (response.status >= 400) {
        handleApiError('create project', response.status, response.body);
      }
      
      return response.body;
    } catch (error) {
      throw new Error(`Failed to create project: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
});