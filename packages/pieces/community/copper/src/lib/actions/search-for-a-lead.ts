import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod, AuthenticationType } from '@activepieces/pieces-common';
import { copperAuth } from '../common/auth';

export const searchLead = createAction({
  auth: copperAuth,
  name: 'search_lead',
  displayName: 'Search for a Lead',
  description: 'Lookup a lead using match criteria.',
  props: {
    // Basic search criteria
    name: Property.ShortText({
      displayName: 'Name',
      description: 'Full name of the lead to search for',
      required: false,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Email address to search for',
      required: false,
    }),
    phoneNumber: Property.ShortText({
      displayName: 'Phone Number',
      description: 'Phone number to search for',
      required: false,
    }),
    
    // Address criteria
    city: Property.ShortText({
      displayName: 'City',
      description: 'City to search for',
      required: false,
    }),
    state: Property.ShortText({
      displayName: 'State',
      description: 'State to search for',
      required: false,
    }),
    postalCode: Property.ShortText({
      displayName: 'Postal Code',
      description: 'Postal code to search for',
      required: false,
    }),
    country: Property.ShortText({
      displayName: 'Country',
      description: 'Country to search for',
      required: false,
    }),
    
    // Lead-specific criteria
    companyName: Property.ShortText({
      displayName: 'Company Name',
      description: 'Company name to search for',
      required: false,
    }),
    customerSourceIds: Property.Array({
      displayName: 'Customer Source IDs',
      description: 'Array of customer source IDs to filter by',
      required: false,
    }),
    statusIds: Property.Array({
      displayName: 'Status IDs',
      description: 'Array of status IDs to filter by',
      required: false,
    }),
    assigneeIds: Property.Array({
      displayName: 'Assignee IDs',
      description: 'Array of assignee IDs to filter by (use -2 for unassigned)',
      required: false,
    }),
    
    // Monetary criteria
    monetaryValueMin: Property.Number({
      displayName: 'Minimum Monetary Value',
      description: 'Minimum monetary value to filter by',
      required: false,
    }),
    monetaryValueMax: Property.Number({
      displayName: 'Maximum Monetary Value',
      description: 'Maximum monetary value to filter by',
      required: false,
    }),
    
    // Tags and socials
    tags: Property.Array({
      displayName: 'Tags',
      description: 'Array of tags to search for',
      required: false,
    }),
    socials: Property.Array({
      displayName: 'Socials',
      description: 'Array of social media URLs to search for',
      required: false,
    }),
    
    // Date criteria
    dateCreatedStart: Property.ShortText({
      displayName: 'Date Created Start',
      description: 'Start date for when lead was created (YYYY-MM-DD format or Unix timestamp)',
      required: false,
    }),
    dateCreatedEnd: Property.ShortText({
      displayName: 'Date Created End',
      description: 'End date for when lead was created (YYYY-MM-DD format or Unix timestamp)',
      required: false,
    }),
    dateModifiedStart: Property.ShortText({
      displayName: 'Date Modified Start',
      description: 'Start date for when lead was last modified (YYYY-MM-DD format or Unix timestamp)',
      required: false,
    }),
    dateModifiedEnd: Property.ShortText({
      displayName: 'Date Modified End',
      description: 'End date for when lead was last modified (YYYY-MM-DD format or Unix timestamp)',
      required: false,
    }),
    dateLastContactedStart: Property.ShortText({
      displayName: 'Date Last Contacted Start',
      description: 'Start date for last interaction (YYYY-MM-DD format or Unix timestamp)',
      required: false,
    }),
    dateLastContactedEnd: Property.ShortText({
      displayName: 'Date Last Contacted End',
      description: 'End date for last interaction (YYYY-MM-DD format or Unix timestamp)',
      required: false,
    }),
    dateStatusChangedStart: Property.ShortText({
      displayName: 'Date Status Changed Start',
      description: 'Start date for when status was last changed (YYYY-MM-DD format or Unix timestamp)',
      required: false,
    }),
    dateStatusChangedEnd: Property.ShortText({
      displayName: 'Date Status Changed End',
      description: 'End date for when status was last changed (YYYY-MM-DD format or Unix timestamp)',
      required: false,
    }),
    
    // Interaction criteria
    interactionCountMin: Property.Number({
      displayName: 'Minimum Interaction Count',
      description: 'Minimum number of interactions',
      required: false,
    }),
    interactionCountMax: Property.Number({
      displayName: 'Maximum Interaction Count',
      description: 'Maximum number of interactions',
      required: false,
    }),
    
    // Followed criteria
    followed: Property.Checkbox({
      displayName: 'Followed',
      description: 'Filter by whether the lead is followed',
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
      defaultValue: 25,
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
          { label: 'Date Created', value: 'date_created' },
          { label: 'Date Modified', value: 'date_modified' },
          { label: 'Date Last Contacted', value: 'date_last_contacted' },
          { label: 'Interaction Count', value: 'interaction_count' },
          { label: 'Monetary Value', value: 'monetary_value' },
        ],
      },
    }),
  },
  async run(context) {
    const {
      name,
      email,
      phoneNumber,
      city,
      state,
      postalCode,
      country,
      companyName,
      customerSourceIds,
      statusIds,
      assigneeIds,
      monetaryValueMin,
      monetaryValueMax,
      tags,
      socials,
      dateCreatedStart,
      dateCreatedEnd,
      dateModifiedStart,
      dateModifiedEnd,
      dateLastContactedStart,
      dateLastContactedEnd,
      dateStatusChangedStart,
      dateStatusChangedEnd,
      interactionCountMin,
      interactionCountMax,
      followed,
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
    } = context.propsValue;

    // Build the request body
    const requestBody: any = {};

    // Add basic search criteria
    if (name) requestBody.name = name;
    if (email) requestBody.email = email;
    if (phoneNumber) requestBody.phone_number = phoneNumber;
    if (companyName) requestBody.company_name = companyName;

    // Add address criteria
    if (city || state || postalCode || country) {
      requestBody.address = {};
      if (city) requestBody.address.city = city;
      if (state) requestBody.address.state = state;
      if (postalCode) requestBody.address.postal_code = postalCode;
      if (country) requestBody.address.country = country;
    }

    // Add lead-specific criteria
    if (customerSourceIds && customerSourceIds.length > 0) {
      requestBody.customer_source_ids = customerSourceIds;
    }
    if (statusIds && statusIds.length > 0) {
      requestBody.status_ids = statusIds;
    }
    if (assigneeIds && assigneeIds.length > 0) {
      requestBody.assignee_ids = assigneeIds;
    }

    // Add monetary criteria
    if (monetaryValueMin !== undefined) requestBody.monetary_value_min = monetaryValueMin;
    if (monetaryValueMax !== undefined) requestBody.monetary_value_max = monetaryValueMax;

    // Add tags and socials
    if (tags && tags.length > 0) requestBody.tags = tags;
    if (socials && socials.length > 0) requestBody.socials = socials;

    // Add date criteria
    if (dateCreatedStart) {
      if (/^\d+$/.test(dateCreatedStart)) {
        requestBody.date_created_start = parseInt(dateCreatedStart);
      } else {
        requestBody.date_created_start = Math.floor(new Date(dateCreatedStart).getTime() / 1000);
      }
    }
    if (dateCreatedEnd) {
      if (/^\d+$/.test(dateCreatedEnd)) {
        requestBody.date_created_end = parseInt(dateCreatedEnd);
      } else {
        requestBody.date_created_end = Math.floor(new Date(dateCreatedEnd).getTime() / 1000);
      }
    }
    if (dateModifiedStart) {
      if (/^\d+$/.test(dateModifiedStart)) {
        requestBody.date_modified_start = parseInt(dateModifiedStart);
      } else {
        requestBody.date_modified_start = Math.floor(new Date(dateModifiedStart).getTime() / 1000);
      }
    }
    if (dateModifiedEnd) {
      if (/^\d+$/.test(dateModifiedEnd)) {
        requestBody.date_modified_end = parseInt(dateModifiedEnd);
      } else {
        requestBody.date_modified_end = Math.floor(new Date(dateModifiedEnd).getTime() / 1000);
      }
    }
    if (dateLastContactedStart) {
      if (/^\d+$/.test(dateLastContactedStart)) {
        requestBody.date_last_contacted_start = parseInt(dateLastContactedStart);
      } else {
        requestBody.date_last_contacted_start = Math.floor(new Date(dateLastContactedStart).getTime() / 1000);
      }
    }
    if (dateLastContactedEnd) {
      if (/^\d+$/.test(dateLastContactedEnd)) {
        requestBody.date_last_contacted_end = parseInt(dateLastContactedEnd);
      } else {
        requestBody.date_last_contacted_end = Math.floor(new Date(dateLastContactedEnd).getTime() / 1000);
      }
    }
    if (dateStatusChangedStart) {
      if (/^\d+$/.test(dateStatusChangedStart)) {
        requestBody.date_status_changed_start = parseInt(dateStatusChangedStart);
      } else {
        requestBody.date_status_changed_start = Math.floor(new Date(dateStatusChangedStart).getTime() / 1000);
      }
    }
    if (dateStatusChangedEnd) {
      if (/^\d+$/.test(dateStatusChangedEnd)) {
        requestBody.date_status_changed_end = parseInt(dateStatusChangedEnd);
      } else {
        requestBody.date_status_changed_end = Math.floor(new Date(dateStatusChangedEnd).getTime() / 1000);
      }
    }

    // Add interaction count criteria
    if (interactionCountMin !== undefined) requestBody.interaction_count_min = interactionCountMin;
    if (interactionCountMax !== undefined) requestBody.interaction_count_max = interactionCountMax;

    // Add followed criteria
    if (followed !== undefined) requestBody.followed = followed;

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

    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: 'https://api.copper.com/developer_api/v1/leads/search',
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
      throw new Error(`Error searching leads: ${error.message}`);
    }
  },
});
