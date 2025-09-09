import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod, AuthenticationType } from '@activepieces/pieces-common';
import { copperAuth } from '../common/auth';

export const searchCompany = createAction({
  auth: copperAuth,
  name: 'search_company',
  displayName: 'Search for a Company',
  description: 'Lookup a company using match criteria.',
  props: {
    // Basic search criteria
    ids: Property.Array({
      displayName: 'Company IDs',
      description: 'Array of specific company IDs to search for',
      required: false,
    }),
    name: Property.ShortText({
      displayName: 'Company Name',
      description: 'Full name of the company to search for',
      required: false,
    }),
    phoneNumber: Property.ShortText({
      displayName: 'Phone Number',
      description: 'Phone number of the company to search for',
      required: false,
    }),
    emailDomains: Property.ShortText({
      displayName: 'Email Domains',
      description: 'Email domains of the company to search for',
      required: false,
    }),
    
    // Address criteria
    city: Property.ShortText({
      displayName: 'City',
      description: 'City in which the company must be located',
      required: false,
    }),
    state: Property.ShortText({
      displayName: 'State',
      description: 'State or province in which the company must be located',
      required: false,
    }),
    postalCode: Property.ShortText({
      displayName: 'Postal Code',
      description: 'Postal code in which the company must be located',
      required: false,
    }),
    country: Property.ShortText({
      displayName: 'Country',
      description: 'Two character country code where the company must be located',
      required: false,
    }),
    
    // Relationship criteria
    contactTypeIds: Property.Array({
      displayName: 'Contact Type IDs',
      description: 'Array of contact type IDs to search for',
      required: false,
    }),
    assigneeIds: Property.Array({
      displayName: 'Assignee IDs',
      description: 'Array of user IDs that the company must be owned by (use -2 for companies with no owner)',
      required: false,
    }),
    
    // Tags and socials
    tags: Property.Array({
      displayName: 'Tags',
      description: 'Array of tags to filter companies by (matches at least one)',
      required: false,
    }),
    socials: Property.Array({
      displayName: 'Socials',
      description: 'Array of social accounts to filter companies by (matches at least one)',
      required: false,
    }),
    
    // Followed criteria
    followed: Property.StaticDropdown({
      displayName: 'Followed',
      description: 'Filter by whether the company is followed',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Followed', value: 1 },
          { label: 'Not Followed', value: 2 },
        ],
      },
    }),
    
    // Age criteria
    age: Property.Number({
      displayName: 'Maximum Age (seconds)',
      description: 'Maximum age in seconds that each company must be',
      required: false,
    }),
    
    // Interaction criteria
    minimumInteractionCount: Property.Number({
      displayName: 'Minimum Interaction Count',
      description: 'Minimum number of interactions the company must have had',
      required: false,
    }),
    maximumInteractionCount: Property.Number({
      displayName: 'Maximum Interaction Count',
      description: 'Maximum number of interactions the company must have had',
      required: false,
    }),
    
    // Date criteria
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
    minimumCreatedDate: Property.ShortText({
      displayName: 'Minimum Created Date',
      description: 'Earliest date when companies were created (YYYY-MM-DD format or Unix timestamp)',
      required: false,
    }),
    maximumCreatedDate: Property.ShortText({
      displayName: 'Maximum Created Date',
      description: 'Latest date when companies were created (YYYY-MM-DD format or Unix timestamp)',
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
      defaultValue: 'date_modified',
      options: {
        disabled: false,
        options: [
          { label: 'Name', value: 'name' },
          { label: 'Phone', value: 'phone' },
          { label: 'Contact', value: 'contact' },
          { label: 'Contact First Name', value: 'contact_first_name' },
          { label: 'Contact Last Name', value: 'contact_last_name' },
          { label: 'Date Modified', value: 'date_modified' },
          { label: 'Date Created', value: 'date_created' },
          { label: 'Email Domain', value: 'email_domain' },
          { label: 'City', value: 'city' },
          { label: 'State', value: 'state' },
          { label: 'Country', value: 'country' },
          { label: 'ZIP', value: 'zip' },
          { label: 'Assignee', value: 'assignee' },
          { label: 'Contact Group', value: 'contact_group' },
          { label: 'Last Interaction', value: 'last_interaction' },
          { label: 'Interaction Count', value: 'interaction_count' },
          { label: 'Primary Website', value: 'primary_website' },
          { label: 'Socials', value: 'socials' },
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
      phoneNumber,
      emailDomains,
      city,
      state,
      postalCode,
      country,
      contactTypeIds,
      assigneeIds,
      tags,
      socials,
      followed,
      age,
      minimumInteractionCount,
      maximumInteractionCount,
      minimumInteractionDate,
      maximumInteractionDate,
      minimumCreatedDate,
      maximumCreatedDate,
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
    if (phoneNumber) requestBody.phone_number = phoneNumber;
    if (emailDomains) requestBody.email_domains = emailDomains;

    // Add address criteria
    if (city) requestBody.city = city;
    if (state) requestBody.state = state;
    if (postalCode) requestBody.postal_code = postalCode;
    if (country) requestBody.country = country;

    // Add relationship criteria
    if (contactTypeIds && contactTypeIds.length > 0) {
      requestBody.contact_type_ids = contactTypeIds;
    }
    if (assigneeIds && assigneeIds.length > 0) {
      requestBody.assignee_ids = assigneeIds;
    }

    // Add tags and socials
    if (tags && tags.length > 0) requestBody.tags = tags;
    if (socials && socials.length > 0) requestBody.socials = socials;

    // Add followed criteria
    if (followed !== undefined) requestBody.followed = followed;

    // Add age criteria
    if (age !== undefined) requestBody.age = age;

    // Add interaction count criteria
    if (minimumInteractionCount !== undefined) requestBody.minimum_interaction_count = minimumInteractionCount;
    if (maximumInteractionCount !== undefined) requestBody.maximum_interaction_count = maximumInteractionCount;

    // Add date criteria
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
        url: 'https://api.copper.com/developer_api/v1/companies/search',
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
      throw new Error(`Error searching companies: ${error.message}`);
    }
  },
});
