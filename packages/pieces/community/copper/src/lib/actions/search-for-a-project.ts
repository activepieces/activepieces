import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod, AuthenticationType } from '@activepieces/pieces-common';
import { copperAuth } from '../common/auth';

export const searchProject = createAction({
  auth: copperAuth,
  name: 'search_project',
  displayName: 'Search for a Project',
  description: 'Lookup a project using match criteria.',
  props: {
    // Basic search criteria
    ids: Property.Array({
      displayName: 'Project IDs',
      description: 'Array of specific project IDs to search for',
      required: false,
    }),
    name: Property.ShortText({
      displayName: 'Project Name',
      description: 'Full name of the project to search for',
      required: false,
    }),
    
    // Relationship criteria
    assigneeIds: Property.Array({
      displayName: 'Assignee IDs',
      description: 'Array of user IDs that projects must be owned by (use -2 for projects with no owner)',
      required: false,
    }),
    statusIds: Property.Array({
      displayName: 'Status IDs',
      description: 'Array of project status IDs to filter by',
      required: false,
    }),
    
    // Tags
    tags: Property.Array({
      displayName: 'Tags',
      description: 'Array of tags to filter projects by (matches at least one)',
      required: false,
    }),
    
    // Followed criteria
    followed: Property.StaticDropdown({
      displayName: 'Followed',
      description: 'Filter by whether the project is followed',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Followed', value: 1 },
          { label: 'Not Followed', value: 2 },
        ],
      },
    }),
    
    // Date criteria
    minimumCreatedDate: Property.ShortText({
      displayName: 'Minimum Created Date',
      description: 'Earliest date when projects were created (YYYY-MM-DD format or Unix timestamp)',
      required: false,
    }),
    maximumCreatedDate: Property.ShortText({
      displayName: 'Maximum Created Date',
      description: 'Latest date when projects were created (YYYY-MM-DD format or Unix timestamp)',
      required: false,
    }),
    minimumModifiedDate: Property.ShortText({
      displayName: 'Minimum Modified Date',
      description: 'Earliest date when projects were modified (YYYY-MM-DD format or Unix timestamp)',
      required: false,
    }),
    maximumModifiedDate: Property.ShortText({
      displayName: 'Maximum Modified Date',
      description: 'Latest date when projects were modified (YYYY-MM-DD format or Unix timestamp)',
      required: false,
    }),
    
    // Custom fields
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
    customField1MinValue: Property.ShortText({
      displayName: 'Custom Field 1 Min Value',
      description: 'Minimum value for the first custom field (for date/number fields)',
      required: false,
    }),
    customField1MaxValue: Property.ShortText({
      displayName: 'Custom Field 1 Max Value',
      description: 'Maximum value for the first custom field (for date/number fields)',
      required: false,
    }),
    customField1AllowEmpty: Property.Checkbox({
      displayName: 'Custom Field 1 Allow Empty',
      description: 'Allow empty values for the first custom field',
      required: false,
    }),
    customField1Option: Property.StaticDropdown({
      displayName: 'Custom Field 1 Option',
      description: 'Option for multi-select custom fields (ANY or ALL)',
      required: false,
      defaultValue: 'ANY',
      options: {
        disabled: false,
        options: [
          { label: 'ANY', value: 'ANY' },
          { label: 'ALL', value: 'ALL' },
        ],
      },
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
    customField2MinValue: Property.ShortText({
      displayName: 'Custom Field 2 Min Value',
      description: 'Minimum value for the second custom field (for date/number fields)',
      required: false,
    }),
    customField2MaxValue: Property.ShortText({
      displayName: 'Custom Field 2 Max Value',
      description: 'Maximum value for the second custom field (for date/number fields)',
      required: false,
    }),
    customField2AllowEmpty: Property.Checkbox({
      displayName: 'Custom Field 2 Allow Empty',
      description: 'Allow empty values for the second custom field',
      required: false,
    }),
    customField2Option: Property.StaticDropdown({
      displayName: 'Custom Field 2 Option',
      description: 'Option for multi-select custom fields (ANY or ALL)',
      required: false,
      defaultValue: 'ANY',
      options: {
        disabled: false,
        options: [
          { label: 'ANY', value: 'ANY' },
          { label: 'ALL', value: 'ALL' },
        ],
      },
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
    customField3MinValue: Property.ShortText({
      displayName: 'Custom Field 3 Min Value',
      description: 'Minimum value for the third custom field (for date/number fields)',
      required: false,
    }),
    customField3MaxValue: Property.ShortText({
      displayName: 'Custom Field 3 Max Value',
      description: 'Maximum value for the third custom field (for date/number fields)',
      required: false,
    }),
    customField3AllowEmpty: Property.Checkbox({
      displayName: 'Custom Field 3 Allow Empty',
      description: 'Allow empty values for the third custom field',
      required: false,
    }),
    customField3Option: Property.StaticDropdown({
      displayName: 'Custom Field 3 Option',
      description: 'Option for multi-select custom fields (ANY or ALL)',
      required: false,
      defaultValue: 'ANY',
      options: {
        disabled: false,
        options: [
          { label: 'ANY', value: 'ANY' },
          { label: 'ALL', value: 'ALL' },
        ],
      },
    }),
    
    // Pagination and sorting
    pageNumber: Property.Number({
      displayName: 'Page Number',
      description: 'Page number to retrieve (starting with 1)',
      required: false,
      defaultValue: 1,
    }),
    pageSize: Property.Number({
      displayName: 'Page Size',
      description: 'Number of entries per page (max 200)',
      required: false,
      defaultValue: 20,
    }),
    sortBy: Property.StaticDropdown({
      displayName: 'Sort By',
      description: 'Field to sort results by',
      required: false,
      defaultValue: 'name',
      options: {
        disabled: false,
        options: [
          { label: 'Name', value: 'name' },
          { label: 'Assigned To', value: 'assigned_to' },
          { label: 'Related To', value: 'related_to' },
          { label: 'Status', value: 'status' },
          { label: 'Date Modified', value: 'date_modified' },
          { label: 'Date Created', value: 'date_created' },
        ],
      },
    }),
    sortDirection: Property.StaticDropdown({
      displayName: 'Sort Direction',
      description: 'Direction to sort results',
      required: false,
      defaultValue: 'asc',
      options: {
        disabled: false,
        options: [
          { label: 'Ascending', value: 'asc' },
          { label: 'Descending', value: 'desc' },
        ],
      },
    }),
  },
  async run(context) {
    const {
      ids,
      name,
      assigneeIds,
      statusIds,
      tags,
      followed,
      minimumCreatedDate,
      maximumCreatedDate,
      minimumModifiedDate,
      maximumModifiedDate,
      customField1Id,
      customField1Value,
      customField1MinValue,
      customField1MaxValue,
      customField1AllowEmpty,
      customField1Option,
      customField2Id,
      customField2Value,
      customField2MinValue,
      customField2MaxValue,
      customField2AllowEmpty,
      customField2Option,
      customField3Id,
      customField3Value,
      customField3MinValue,
      customField3MaxValue,
      customField3AllowEmpty,
      customField3Option,
      pageNumber,
      pageSize,
      sortBy,
      sortDirection,
    } = context.propsValue;

    // Build the request body
    const requestBody: any = {};

    // Add basic search criteria
    if (ids && ids.length > 0) requestBody.ids = ids;
    if (name) requestBody.name = name;

    // Add relationship criteria
    if (assigneeIds && assigneeIds.length > 0) {
      requestBody.assignee_ids = assigneeIds;
    }
    if (statusIds && statusIds.length > 0) {
      requestBody.status_ids = statusIds;
    }

    // Add tags
    if (tags && tags.length > 0) requestBody.tags = tags;

    // Add followed criteria
    if (followed !== undefined) requestBody.followed = followed;

    // Add date criteria
    if (minimumCreatedDate) {
      if (/^\d+$/.test(minimumCreatedDate)) {
        requestBody.minimum_created_date = parseInt(minimumCreatedDate);
      } else {
        requestBody.minimum_created_date = Math.floor(new Date(minimumCreatedDate).getTime() / 1000);
      }
    }
    if (maximumCreatedDate) {
      if (/^\d+$/.test(maximumCreatedDate)) {
        requestBody.maximum_created_date = parseInt(maximumCreatedDate);
      } else {
        requestBody.maximum_created_date = Math.floor(new Date(maximumCreatedDate).getTime() / 1000);
      }
    }
    if (minimumModifiedDate) {
      if (/^\d+$/.test(minimumModifiedDate)) {
        requestBody.minimum_modified_date = parseInt(minimumModifiedDate);
      } else {
        requestBody.minimum_modified_date = Math.floor(new Date(minimumModifiedDate).getTime() / 1000);
      }
    }
    if (maximumModifiedDate) {
      if (/^\d+$/.test(maximumModifiedDate)) {
        requestBody.maximum_modified_date = parseInt(maximumModifiedDate);
      } else {
        requestBody.maximum_modified_date = Math.floor(new Date(maximumModifiedDate).getTime() / 1000);
      }
    }

    // Add custom fields
    const customFields: any[] = [];
    
    // Custom Field 1
    if (customField1Id) {
      const customField: any = { custom_field_definition_id: customField1Id };
      if (customField1Value) customField.value = customField1Value;
      if (customField1MinValue) {
        if (/^\d+$/.test(customField1MinValue)) {
          customField.minimum_value = parseInt(customField1MinValue);
        } else {
          customField.minimum_value = Math.floor(new Date(customField1MinValue).getTime() / 1000);
        }
      }
      if (customField1MaxValue) {
        if (/^\d+$/.test(customField1MaxValue)) {
          customField.maximum_value = parseInt(customField1MaxValue);
        } else {
          customField.maximum_value = Math.floor(new Date(customField1MaxValue).getTime() / 1000);
        }
      }
      if (customField1AllowEmpty) customField.allow_empty = true;
      if (customField1Option) customField.option = customField1Option;
      customFields.push(customField);
    }

    // Custom Field 2
    if (customField2Id) {
      const customField: any = { custom_field_definition_id: customField2Id };
      if (customField2Value) customField.value = customField2Value;
      if (customField2MinValue) {
        if (/^\d+$/.test(customField2MinValue)) {
          customField.minimum_value = parseInt(customField2MinValue);
        } else {
          customField.minimum_value = Math.floor(new Date(customField2MinValue).getTime() / 1000);
        }
      }
      if (customField2MaxValue) {
        if (/^\d+$/.test(customField2MaxValue)) {
          customField.maximum_value = parseInt(customField2MaxValue);
        } else {
          customField.maximum_value = Math.floor(new Date(customField2MaxValue).getTime() / 1000);
        }
      }
      if (customField2AllowEmpty) customField.allow_empty = true;
      if (customField2Option) customField.option = customField2Option;
      customFields.push(customField);
    }

    // Custom Field 3
    if (customField3Id) {
      const customField: any = { custom_field_definition_id: customField3Id };
      if (customField3Value) customField.value = customField3Value;
      if (customField3MinValue) {
        if (/^\d+$/.test(customField3MinValue)) {
          customField.minimum_value = parseInt(customField3MinValue);
        } else {
          customField.minimum_value = Math.floor(new Date(customField3MinValue).getTime() / 1000);
        }
      }
      if (customField3MaxValue) {
        if (/^\d+$/.test(customField3MaxValue)) {
          customField.maximum_value = parseInt(customField3MaxValue);
        } else {
          customField.maximum_value = Math.floor(new Date(customField3MaxValue).getTime() / 1000);
        }
      }
      if (customField3AllowEmpty) customField.allow_empty = true;
      if (customField3Option) customField.option = customField3Option;
      customFields.push(customField);
    }

    if (customFields.length > 0) {
      requestBody.custom_fields = customFields;
    }

    // Add pagination and sorting
    if (pageNumber) requestBody.page_number = pageNumber;
    if (pageSize) requestBody.page_size = Math.min(pageSize, 200); // Cap at 200
    if (sortBy) requestBody.sort_by = sortBy;
    if (sortDirection) requestBody.sort_direction = sortDirection;

    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: 'https://api.copper.com/developer_api/v1/projects/search',
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
      throw new Error(`Error searching projects: ${error.message}`);
    }
  },
});
