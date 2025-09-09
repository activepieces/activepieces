import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod, AuthenticationType } from '@activepieces/pieces-common';
import { copperAuth } from '../common/auth';

export const createLead = createAction({
  auth: copperAuth,
  name: 'create_lead',
  displayName: 'Create Lead',
  description: 'Adds a new lead to Copper CRM.',
  props: {
    name: Property.ShortText({
      displayName: 'Name',
      description: 'Full name of the lead',
      required: true,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Primary email address',
      required: false,
    }),
    emailCategory: Property.StaticDropdown({
      displayName: 'Email Category',
      description: 'Category for the email address',
      required: false,
      defaultValue: 'work',
      options: {
        disabled: false,
        options: [
          { label: 'Work', value: 'work' },
          { label: 'Personal', value: 'personal' },
          { label: 'Other', value: 'other' },
        ],
      },
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
      defaultValue: 'mobile',
      options: {
        disabled: false,
        options: [
          { label: 'Mobile', value: 'mobile' },
          { label: 'Work', value: 'work' },
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
    customerSourceId: Property.Number({
      displayName: 'Customer Source ID',
      description: 'ID of the customer source for this lead',
      required: false,
    }),
    details: Property.LongText({
      displayName: 'Details',
      description: 'Additional details about the lead',
      required: false,
    }),
    title: Property.ShortText({
      displayName: 'Title',
      description: 'Job title or position',
      required: false,
    }),
    companyName: Property.ShortText({
      displayName: 'Company Name',
      description: 'Name of the company',
      required: false,
    }),
    monetaryValue: Property.Number({
      displayName: 'Monetary Value',
      description: 'Expected monetary value of the lead',
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
  },
  async run(context) {
    const {
      name,
      email,
      emailCategory,
      phoneNumber,
      phoneCategory,
      street,
      city,
      state,
      postalCode,
      country,
      customerSourceId,
      details,
      title,
      companyName,
      monetaryValue,
      customField1Id,
      customField1Value,
      customField2Id,
      customField2Value,
      customField3Id,
      customField3Value,
    } = context.propsValue;

    // Build the request body
    const requestBody: any = {
      name: name,
    };

    // Add email if provided
    if (email) {
      requestBody.email = {
        email: email,
        category: emailCategory || 'work',
      };
    }

    // Add phone numbers if provided
    if (phoneNumber) {
      requestBody.phone_numbers = [
        {
          number: phoneNumber,
          category: phoneCategory || 'mobile',
        },
      ];
    }

    // Add address if any address field is provided
    if (street || city || state || postalCode || country) {
      requestBody.address = {
        ...(street && { street }),
        ...(city && { city }),
        ...(state && { state }),
        ...(postalCode && { postal_code: postalCode }),
        ...(country && { country }),
      };
    }

    // Add optional fields if provided
    if (customerSourceId) {
      requestBody.customer_source_id = customerSourceId;
    }
    if (details) {
      requestBody.details = details;
    }
    if (title) {
      requestBody.title = title;
    }
    if (companyName) {
      requestBody.company_name = companyName;
    }
    if (monetaryValue) {
      requestBody.monetary_value = monetaryValue;
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

    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: 'https://api.copper.com/developer_api/v1/leads',
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
      throw new Error(`Error creating lead: ${error.message}`);
    }
  },
});
