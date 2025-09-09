import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod, AuthenticationType } from '@activepieces/pieces-common';
import { copperAuth } from '../common/auth';

export const updateCompany = createAction({
  auth: copperAuth,
  name: 'update_company',
  displayName: 'Update Company',
  description: 'Updates an existing company. Only specified fields will be updated.',
  props: {
    companyId: Property.ShortText({
      displayName: 'Company ID',
      description: 'The ID of the company to update',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Company Name',
      description: 'Name of the company',
      required: false,
    }),
    emailDomain: Property.ShortText({
      displayName: 'Email Domain',
      description: 'Email domain of the company (e.g., company.com)',
      required: false,
    }),
    details: Property.LongText({
      displayName: 'Details',
      description: 'Additional details about the company',
      required: false,
    }),
    phoneNumber: Property.ShortText({
      displayName: 'Phone Number',
      description: 'Primary phone number',
      required: false,
    }),
    phoneCategory: Property.StaticDropdown({
      displayName: 'Phone Category',
      description: 'Category for the phone number',
      required: false,
      defaultValue: 'work',
      options: {
        disabled: false,
        options: [
          { label: 'Work', value: 'work' },
          { label: 'Mobile', value: 'mobile' },
          { label: 'Home', value: 'home' },
          { label: 'Other', value: 'other' },
        ],
      },
    }),
    street: Property.ShortText({
      displayName: 'Street Address',
      description: 'Street address',
      required: false,
    }),
    city: Property.ShortText({
      displayName: 'City',
      description: 'City',
      required: false,
    }),
    state: Property.ShortText({
      displayName: 'State',
      description: 'State or province',
      required: false,
    }),
    postalCode: Property.ShortText({
      displayName: 'Postal Code',
      description: 'Postal or ZIP code',
      required: false,
    }),
    country: Property.ShortText({
      displayName: 'Country',
      description: 'Country',
      required: false,
    }),
    primaryContactId: Property.Number({
      displayName: 'Primary Contact ID',
      description: 'ID of the primary contact for this company',
      required: false,
    }),
    assigneeId: Property.Number({
      displayName: 'Assignee ID',
      description: 'ID of the user assigned to this company',
      required: false,
    }),
    contactTypeId: Property.Number({
      displayName: 'Contact Type ID',
      description: 'Contact type ID for this company',
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
    clearPhone: Property.Checkbox({
      displayName: 'Clear Phone',
      description: 'Set to true to remove the phone number field (set to null)',
      required: false,
      defaultValue: false,
    }),
    clearAddress: Property.Checkbox({
      displayName: 'Clear Address',
      description: 'Set to true to remove the address field (set to null)',
      required: false,
      defaultValue: false,
    }),
    clearEmailDomain: Property.Checkbox({
      displayName: 'Clear Email Domain',
      description: 'Set to true to remove the email domain field (set to null)',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const {
      companyId,
      name,
      emailDomain,
      details,
      phoneNumber,
      phoneCategory,
      street,
      city,
      state,
      postalCode,
      country,
      primaryContactId,
      assigneeId,
      contactTypeId,
      customField1Id,
      customField1Value,
      customField2Id,
      customField2Value,
      customField3Id,
      customField3Value,
      clearPhone,
      clearAddress,
      clearEmailDomain,
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
    if (primaryContactId !== undefined) {
      requestBody.primary_contact_id = primaryContactId;
    }
    if (assigneeId !== undefined) {
      requestBody.assignee_id = assigneeId;
    }
    if (contactTypeId !== undefined) {
      requestBody.contact_type_id = contactTypeId;
    }

    // Handle email domain - either update, clear, or leave unchanged
    if (clearEmailDomain) {
      requestBody.email_domain = null;
    } else if (emailDomain !== undefined && emailDomain !== '') {
      requestBody.email_domain = emailDomain;
    }

    // Handle phone number - either update, clear, or leave unchanged
    if (clearPhone) {
      requestBody.phone_numbers = null;
    } else if (phoneNumber !== undefined && phoneNumber !== '') {
      requestBody.phone_numbers = [
        {
          number: phoneNumber,
          category: phoneCategory || 'work',
        },
      ];
    }

    // Handle address - either update, clear, or leave unchanged
    if (clearAddress) {
      requestBody.address = null;
    } else if (street || city || state || postalCode || country) {
      requestBody.address = {
        ...(street && { street }),
        ...(city && { city }),
        ...(state && { state }),
        ...(postalCode && { postal_code: postalCode }),
        ...(country && { country }),
      };
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
        url: `https://api.copper.com/developer_api/v1/companies/${companyId}`,
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
        throw new Error(`Company with ID ${companyId} not found.`);
      }
      throw new Error(`Error updating company: ${error.message}`);
    }
  },
});
