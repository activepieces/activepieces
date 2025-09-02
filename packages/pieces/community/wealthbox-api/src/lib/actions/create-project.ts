import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const createProject = createAction({
  name: 'create_project',
  displayName: 'Create Project',
  description: 'Starts a new project with description and organizer',
  props: {
    // Required fields
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
    
    // Organizer
    organizer: Property.Number({
      displayName: 'Organizer User ID',
      description: 'The ID of the user who will be responsible for organizing this project',
      required: false
    }),
    
    // Visibility
    visible_to: Property.StaticDropdown({
      displayName: 'Visible To',
      description: 'Who can view this project',
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
    }),
    custom_field_3_id: Property.Number({
      displayName: 'Custom Field 3 ID',
      description: 'ID of the third custom field to set (optional)',
      required: false
    }),
    custom_field_3_value: Property.ShortText({
      displayName: 'Custom Field 3 Value',
      description: 'Value for the third custom field',
      required: false
    })
  },
  
  async run(context) {
    const { auth, propsValue } = context;
    
    if (!auth) {
      throw new Error('Authentication is required');
    }
    

    
    // Build the request body
    const requestBody: any = {
      name: propsValue.name,
      description: propsValue.description
    };
    
    // Add optional fields if provided
    if (propsValue.organizer) {
      requestBody.organizer = propsValue.organizer;
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
    
    if (propsValue.custom_field_3_id && propsValue.custom_field_3_value) {
      customFields.push({
        id: propsValue.custom_field_3_id,
        value: propsValue.custom_field_3_value
      });
    }
    
    if (customFields.length > 0) {
      requestBody.custom_fields = customFields;
    }
    
    // Make the API request
    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: 'https://api.crmworkspace.com/v1/projects',
        headers: {
          'ACCESS_TOKEN': auth as string,
          'Content-Type': 'application/json'
        },
        body: requestBody
      });
      
      if (response.status >= 400) {
        throw new Error(`Wealthbox API error: ${response.status} - ${JSON.stringify(response.body)}`);
      }
      
      return response.body;
    } catch (error) {
      throw new Error(`Failed to create project: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
});