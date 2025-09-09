import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod, AuthenticationType } from '@activepieces/pieces-common';
import { copperAuth } from '../common/auth';

export const updateProject = createAction({
  auth: copperAuth,
  name: 'update_project',
  displayName: 'Update Project',
  description: 'Updates an existing project. Only specified fields will be updated.',
  props: {
    projectId: Property.ShortText({
      displayName: 'Project ID',
      description: 'The ID of the project to update',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Project Name',
      description: 'Name of the project',
      required: false,
    }),
    assigneeId: Property.Number({
      displayName: 'Assignee ID',
      description: 'ID of the user assigned to this project',
      required: false,
    }),
    details: Property.LongText({
      displayName: 'Details',
      description: 'Additional details about the project',
      required: false,
    }),
    relatedResource: Property.ShortText({
      displayName: 'Related Resource',
      description: 'Related resource for this project',
      required: false,
    }),
    customField1Id: Property.Number({
      displayName: 'Custom Field 1 ID',
      description: 'ID of the first custom field definition',
      required: false,
    }),
    customField1Value: Property.ShortText({
      displayName: 'Custom Field 1 Value',
      description: 'Value for the first custom field',
      required: false,
    }),
    customField2Id: Property.Number({
      displayName: 'Custom Field 2 ID',
      description: 'ID of the second custom field definition',
      required: false,
    }),
    customField2Value: Property.ShortText({
      displayName: 'Custom Field 2 Value',
      description: 'Value for the second custom field',
      required: false,
    }),
    customField3Id: Property.Number({
      displayName: 'Custom Field 3 ID',
      description: 'ID of the third custom field definition',
      required: false,
    }),
    customField3Value: Property.ShortText({
      displayName: 'Custom Field 3 Value',
      description: 'Value for the third custom field',
      required: false,
    }),
    clearAssignee: Property.Checkbox({
      displayName: 'Clear Assignee',
      description: 'Set to true to remove the assignee field (set to null)',
      required: false,
      defaultValue: false,
    }),
    clearRelatedResource: Property.Checkbox({
      displayName: 'Clear Related Resource',
      description: 'Set to true to remove the related resource field (set to null)',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const {
      projectId,
      name,
      assigneeId,
      details,
      relatedResource,
      customField1Id,
      customField1Value,
      customField2Id,
      customField2Value,
      customField3Id,
      customField3Value,
      clearAssignee,
      clearRelatedResource,
    } = context.propsValue;

    // Build the request body - only include fields that are provided
    const requestBody: any = {};

    // Add basic fields if provided
    if (name !== undefined && name !== '') {
      requestBody.name = name;
    }
    if (details !== undefined && details !== '') {
      requestBody.details = details;
    }

    // Handle assignee - either update, clear, or leave unchanged
    if (clearAssignee) {
      requestBody.assignee_id = null;
    } else if (assigneeId !== undefined) {
      requestBody.assignee_id = assigneeId;
    }

    // Handle related resource - either update, clear, or leave unchanged
    if (clearRelatedResource) {
      requestBody.related_resource = null;
    } else if (relatedResource !== undefined && relatedResource !== '') {
      requestBody.related_resource = relatedResource;
    }

    // Add custom fields if provided
    const customFields = [];
    if (customField1Id && customField1Value) {
      customFields.push({
        custom_field_definition_id: customField1Id,
        value: customField1Value,
      });
    }
    if (customField2Id && customField2Value) {
      customFields.push({
        custom_field_definition_id: customField2Id,
        value: customField2Value,
      });
    }
    if (customField3Id && customField3Value) {
      customFields.push({
        custom_field_definition_id: customField3Id,
        value: customField3Value,
      });
    }

    if (customFields.length > 0) {
      requestBody.custom_fields = customFields;
    }

    // If no fields are provided, return early
    if (Object.keys(requestBody).length === 0) {
      throw new Error('No fields provided for update. Please specify at least one field to update.');
    }

    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.PUT,
        url: `https://api.copper.com/developer_api/v1/projects/${projectId}`,
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: context.auth.access_token,
        },
        body: requestBody,
      });

      return response.body;
    } catch (error: any) {
      if (error.response?.status === 400) {
        throw new Error(`Bad request: ${JSON.stringify(error.response.body)}`);
      }
      if (error.response?.status === 401) {
        throw new Error('Authentication failed. Please check your credentials.');
      }
      if (error.response?.status === 403) {
        throw new Error('Access forbidden. Please check your permissions.');
      }
      if (error.response?.status === 404) {
        throw new Error(`Project with ID ${projectId} not found.`);
      }
      throw new Error(`Error updating project: ${error.message}`);
    }
  },
});
