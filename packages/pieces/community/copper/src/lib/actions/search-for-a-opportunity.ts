import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod, AuthenticationType } from '@activepieces/pieces-common';
import { copperAuth } from '../common/auth';

export const searchOpportunity = createAction({
  auth: copperAuth,
  name: 'search_opportunity',
  displayName: 'Search for an Opportunity',
  description: 'Lookup an opportunity using match criteria.',
  props: {
    // Basic search criteria
    ids: Property.Array({
      displayName: 'Opportunity IDs',
      description: 'Array of specific opportunity IDs to search for',
      required: false,
    }),
    name: Property.ShortText({
      displayName: 'Opportunity Name',
      description: 'Full name of the opportunity to search for (exact match required)',
      required: false,
    }),
    
    // Relationship criteria
    assigneeIds: Property.Array({
      displayName: 'Assignee IDs',
      description: 'Array of user IDs that opportunities must be owned by (use -2 for opportunities with no owner)',
      required: false,
    }),
    statusIds: Property.Array({
      displayName: 'Status IDs',
      description: 'Array of opportunity status IDs (0: Open, 1: Won, 2: Lost, 3: Abandoned)',
      required: false,
    }),
    pipelineIds: Property.Array({
      displayName: 'Pipeline IDs',
      description: 'Array of pipeline IDs to filter by',
      required: false,
    }),
    pipelineStageIds: Property.Array({
      displayName: 'Pipeline Stage IDs',
      description: 'Array of pipeline stage IDs to filter by',
      required: false,
    }),
    primaryContactIds: Property.Array({
      displayName: 'Primary Contact IDs',
      description: 'Array of primary contact IDs to filter by',
      required: false,
    }),
    priorityIds: Property.Array({
      displayName: 'Priority IDs',
      description: 'Array of priority IDs to filter by',
      required: false,
    }),
    customerSourceIds: Property.Array({
      displayName: 'Customer Source IDs',
      description: 'Array of customer source IDs to filter by (use -2 for no customer source)',
      required: false,
    }),
    lossReasonIds: Property.Array({
      displayName: 'Loss Reason IDs',
      description: 'Array of loss reason IDs to filter by (use -2 for no loss reason)',
      required: false,
    }),
    companyIds: Property.Array({
      displayName: 'Company IDs',
      description: 'Array of company IDs to filter by',
      required: false,
    }),
    
    // Tags and socials
    tags: Property.Array({
      displayName: 'Tags',
      description: 'Array of tags to filter opportunities by (matches at least one)',
      required: false,
    }),
    
    // Followed criteria
    followed: Property.StaticDropdown({
      displayName: 'Followed',
      description: 'Filter by whether the opportunity is followed',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Followed', value: 1 },
          { label: 'Not Followed', value: 2 },
        ],
      },
    }),
    
    // Monetary criteria
    minimumMonetaryValue: Property.Number({
      displayName: 'Minimum Monetary Value',
      description: 'Minimum monetary value opportunities must have',
      required: false,
    }),
    maximumMonetaryValue: Property.Number({
      displayName: 'Maximum Monetary Value',
      description: 'Maximum monetary value opportunities must have',
      required: false,
    }),
    
    // Interaction criteria
    minimumInteractionCount: Property.Number({
      displayName: 'Minimum Interaction Count',
      description: 'Minimum number of interactions opportunities must have had',
      required: false,
    }),
    maximumInteractionCount: Property.Number({
      displayName: 'Maximum Interaction Count',
      description: 'Maximum number of interactions opportunities must have had',
      required: false,
    }),
    
    // Date criteria
    minimumCloseDate: Property.ShortText({
      displayName: 'Minimum Close Date',
      description: 'Earliest close date (YYYY-MM-DD format or Unix timestamp)',
      required: false,
    }),
    maximumCloseDate: Property.ShortText({
      displayName: 'Maximum Close Date',
      description: 'Latest close date (YYYY-MM-DD format or Unix timestamp)',
      required: false,
    }),
    minimumInteractionDate: Property.ShortText({
      displayName: 'Minimum Interaction Date',
      description: 'Earliest date of the last interaction (YYYY-MM-DD format or Unix timestamp)',
      required: false,
    }),
    maximumInteractionDate: Property.ShortText({
      displayName: 'Maximum Interaction Date',
      description: 'Latest date of the last interaction (YYYY-MM-DD format or Unix timestamp)',
      required: false,
    }),
    minimumStageChangeDate: Property.ShortText({
      displayName: 'Minimum Stage Change Date',
      description: 'Earliest date of a stage change (YYYY-MM-DD format or Unix timestamp)',
      required: false,
    }),
    maximumStageChangeDate: Property.ShortText({
      displayName: 'Maximum Stage Change Date',
      description: 'Latest date of a stage change (YYYY-MM-DD format or Unix timestamp)',
      required: false,
    }),
    minimumCreatedDate: Property.ShortText({
      displayName: 'Minimum Created Date',
      description: 'Earliest date when opportunities were created (YYYY-MM-DD format or Unix timestamp)',
      required: false,
    }),
    maximumCreatedDate: Property.ShortText({
      displayName: 'Maximum Created Date',
      description: 'Latest date when opportunities were created (YYYY-MM-DD format or Unix timestamp)',
      required: false,
    }),
    minimumModifiedDate: Property.ShortText({
      displayName: 'Minimum Modified Date',
      description: 'Earliest date when opportunities were modified (YYYY-MM-DD format or Unix timestamp)',
      required: false,
    }),
    maximumModifiedDate: Property.ShortText({
      displayName: 'Maximum Modified Date',
      description: 'Latest date when opportunities were modified (YYYY-MM-DD format or Unix timestamp)',
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
          { label: 'Assignee', value: 'assignee' },
          { label: 'Company Name', value: 'company_name' },
          { label: 'Customer Source ID', value: 'customer_source_id' },
          { label: 'Date Created', value: 'date_created' },
          { label: 'Date Modified', value: 'date_modified' },
          { label: 'Inactive Days', value: 'inactive_days' },
          { label: 'Interaction Count', value: 'interaction_count' },
          { label: 'Last Interaction', value: 'last_interaction' },
          { label: 'Monetary Unit', value: 'monetary_unit' },
          { label: 'Monetary Value', value: 'monetary_value' },
          { label: 'Name', value: 'name' },
          { label: 'Primary Contact', value: 'primary_contact' },
          { label: 'Priority', value: 'priority' },
          { label: 'Stage', value: 'stage' },
          { label: 'Status', value: 'status' },
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
      pipelineIds,
      pipelineStageIds,
      primaryContactIds,
      priorityIds,
      customerSourceIds,
      lossReasonIds,
      companyIds,
      tags,
      followed,
      minimumMonetaryValue,
      maximumMonetaryValue,
      minimumInteractionCount,
      maximumInteractionCount,
      minimumCloseDate,
      maximumCloseDate,
      minimumInteractionDate,
      maximumInteractionDate,
      minimumStageChangeDate,
      maximumStageChangeDate,
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
    if (pipelineIds && pipelineIds.length > 0) {
      requestBody.pipeline_ids = pipelineIds;
    }
    if (pipelineStageIds && pipelineStageIds.length > 0) {
      requestBody.pipeline_stage_ids = pipelineStageIds;
    }
    if (primaryContactIds && primaryContactIds.length > 0) {
      requestBody.primary_contact_ids = primaryContactIds;
    }
    if (priorityIds && priorityIds.length > 0) {
      requestBody.priority_ids = priorityIds;
    }
    if (customerSourceIds && customerSourceIds.length > 0) {
      requestBody.customer_source_ids = customerSourceIds;
    }
    if (lossReasonIds && lossReasonIds.length > 0) {
      requestBody.loss_reason_ids = lossReasonIds;
    }
    if (companyIds && companyIds.length > 0) {
      requestBody.company_ids = companyIds;
    }

    // Add tags
    if (tags && tags.length > 0) requestBody.tags = tags;

    // Add followed criteria
    if (followed !== undefined) requestBody.followed = followed;

    // Add monetary criteria
    if (minimumMonetaryValue !== undefined) requestBody.minimum_monetary_value = minimumMonetaryValue;
    if (maximumMonetaryValue !== undefined) requestBody.maximum_monetary_value = maximumMonetaryValue;

    // Add interaction count criteria
    if (minimumInteractionCount !== undefined) requestBody.minimum_interaction_count = minimumInteractionCount;
    if (maximumInteractionCount !== undefined) requestBody.maximum_interaction_count = maximumInteractionCount;

    // Add date criteria
    if (minimumCloseDate) {
      if (/^\d+$/.test(minimumCloseDate)) {
        requestBody.minimum_close_date = parseInt(minimumCloseDate);
      } else {
        requestBody.minimum_close_date = Math.floor(new Date(minimumCloseDate).getTime() / 1000);
      }
    }
    if (maximumCloseDate) {
      if (/^\d+$/.test(maximumCloseDate)) {
        requestBody.maximum_close_date = parseInt(maximumCloseDate);
      } else {
        requestBody.maximum_close_date = Math.floor(new Date(maximumCloseDate).getTime() / 1000);
      }
    }
    if (minimumInteractionDate) {
      if (/^\d+$/.test(minimumInteractionDate)) {
        requestBody.minimum_interaction_date = parseInt(minimumInteractionDate);
      } else {
        requestBody.minimum_interaction_date = Math.floor(new Date(minimumInteractionDate).getTime() / 1000);
      }
    }
    if (maximumInteractionDate) {
      if (/^\d+$/.test(maximumInteractionDate)) {
        requestBody.maximum_interaction_date = parseInt(maximumInteractionDate);
      } else {
        requestBody.maximum_interaction_date = Math.floor(new Date(maximumInteractionDate).getTime() / 1000);
      }
    }
    if (minimumStageChangeDate) {
      if (/^\d+$/.test(minimumStageChangeDate)) {
        requestBody.minimum_stage_change_date = parseInt(minimumStageChangeDate);
      } else {
        requestBody.minimum_stage_change_date = Math.floor(new Date(minimumStageChangeDate).getTime() / 1000);
      }
    }
    if (maximumStageChangeDate) {
      if (/^\d+$/.test(maximumStageChangeDate)) {
        requestBody.maximum_stage_change_date = parseInt(maximumStageChangeDate);
      } else {
        requestBody.maximum_stage_change_date = Math.floor(new Date(maximumStageChangeDate).getTime() / 1000);
      }
    }
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
        url: 'https://api.copper.com/developer_api/v1/opportunities/search',
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
      throw new Error(`Error searching opportunities: ${error.message}`);
    }
  },
});
