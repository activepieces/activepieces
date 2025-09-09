import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod, AuthenticationType } from '@activepieces/pieces-common';
import { copperAuth } from '../common/auth';

export const searchPerson = createAction({
  auth: copperAuth,
  name: 'search_person',
  displayName: 'Search for a Person',
  description: 'Lookup a person using match criteria.',
  props: {
    // Basic search criteria
    name: Property.ShortText({
      displayName: 'Name',
      description: 'Full name of the person to search for',
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
    
    // Relationship criteria
    companyId: Property.Number({
      displayName: 'Company ID',
      description: 'ID of the company to search for people in',
      required: false,
    }),
    assigneeId: Property.Number({
      displayName: 'Assignee ID',
      description: 'ID of the user assigned to the person (use -2 for unassigned)',
      required: false,
    }),
    contactTypeId: Property.Number({
      displayName: 'Contact Type ID',
      description: 'ID of the contact type to filter by',
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
    dateAddedStart: Property.ShortText({
      displayName: 'Date Added Start',
      description: 'Start date for when person was added (YYYY-MM-DD format or Unix timestamp)',
      required: false,
    }),
    dateAddedEnd: Property.ShortText({
      displayName: 'Date Added End',
      description: 'End date for when person was added (YYYY-MM-DD format or Unix timestamp)',
      required: false,
    }),
    lastInteractionDateStart: Property.ShortText({
      displayName: 'Last Interaction Date Start',
      description: 'Start date for last interaction (YYYY-MM-DD format or Unix timestamp)',
      required: false,
    }),
    lastInteractionDateEnd: Property.ShortText({
      displayName: 'Last Interaction Date End',
      description: 'End date for last interaction (YYYY-MM-DD format or Unix timestamp)',
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
    
    // Opportunity criteria
    opportunityIds: Property.Array({
      displayName: 'Opportunity IDs',
      description: 'Array of opportunity IDs to search for people associated with',
      required: false,
    }),
    
    // Followed criteria
    followed: Property.Checkbox({
      displayName: 'Followed',
      description: 'Filter by whether the person is followed',
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
      companyId,
      assigneeId,
      contactTypeId,
      tags,
      socials,
      dateAddedStart,
      dateAddedEnd,
      lastInteractionDateStart,
      lastInteractionDateEnd,
      interactionCountMin,
      interactionCountMax,
      opportunityIds,
      followed,
      customField1Id,
      customField1Value,
      customField1MinValue,
      customField1MaxValue,
      customField1AllowEmpty,
      customField2Id,
      customField2Value,
      customField2MinValue,
      customField2MaxValue,
      customField2AllowEmpty,
      customField3Id,
      customField3Value,
      customField3MinValue,
      customField3MaxValue,
      customField3AllowEmpty,
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

    // Add address criteria
    if (city || state || postalCode || country) {
      requestBody.address = {};
      if (city) requestBody.address.city = city;
      if (state) requestBody.address.state = state;
      if (postalCode) requestBody.address.postal_code = postalCode;
      if (country) requestBody.address.country = country;
    }

    // Add relationship criteria
    if (companyId) requestBody.company_id = companyId;
    if (assigneeId !== undefined) requestBody.assignee_id = assigneeId;
    if (contactTypeId) requestBody.contact_type_id = contactTypeId;

    // Add tags and socials
    if (tags && tags.length > 0) requestBody.tags = tags;
    if (socials && socials.length > 0) requestBody.socials = socials;

    // Add date criteria
    if (dateAddedStart) {
      if (/^\d+$/.test(dateAddedStart)) {
        requestBody.date_added_start = parseInt(dateAddedStart);
      } else {
        requestBody.date_added_start = Math.floor(new Date(dateAddedStart).getTime() / 1000);
      }
    }
    if (dateAddedEnd) {
      if (/^\d+$/.test(dateAddedEnd)) {
        requestBody.date_added_end = parseInt(dateAddedEnd);
      } else {
        requestBody.date_added_end = Math.floor(new Date(dateAddedEnd).getTime() / 1000);
      }
    }
    if (lastInteractionDateStart) {
      if (/^\d+$/.test(lastInteractionDateStart)) {
        requestBody.date_last_contacted_start = parseInt(lastInteractionDateStart);
      } else {
        requestBody.date_last_contacted_start = Math.floor(new Date(lastInteractionDateStart).getTime() / 1000);
      }
    }
    if (lastInteractionDateEnd) {
      if (/^\d+$/.test(lastInteractionDateEnd)) {
        requestBody.date_last_contacted_end = parseInt(lastInteractionDateEnd);
      } else {
        requestBody.date_last_contacted_end = Math.floor(new Date(lastInteractionDateEnd).getTime() / 1000);
      }
    }

    // Add interaction count criteria
    if (interactionCountMin !== undefined) requestBody.interaction_count_min = interactionCountMin;
    if (interactionCountMax !== undefined) requestBody.interaction_count_max = interactionCountMax;

    // Add opportunity criteria
    if (opportunityIds && opportunityIds.length > 0) requestBody.opportunity_ids = opportunityIds;

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
        url: 'https://api.copper.com/developer_api/v1/people/search',
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
      throw new Error(`Error searching people: ${error.message}`);
    }
  },
});
