import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod, AuthenticationType } from '@activepieces/pieces-common';
import { copperAuth } from '../common/auth';

export const updatePerson = createAction({
  auth: copperAuth,
  name: 'update_person',
  displayName: 'Update Person',
  description: 'Updates a person based on matching criteria. Only specified fields will be updated.',
  props: {
    personId: Property.ShortText({
      displayName: 'Person ID',
      description: 'The ID of the person to update',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Name',
      description: 'Full name of the person',
      required: false,
    }),
    details: Property.LongText({
      displayName: 'Details',
      description: 'Additional details about the person',
      required: false,
    }),
    title: Property.ShortText({
      displayName: 'Title',
      description: 'Job title or position',
      required: false,
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
    clearEmail: Property.Checkbox({
      displayName: 'Clear Email',
      description: 'Set to true to remove the email field (set to null)',
      required: false,
      defaultValue: false,
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
  },
  async run(context) {
    const {
      personId,
      name,
      details,
      title,
      email,
      emailCategory,
      phoneNumber,
      phoneCategory,
      street,
      city,
      state,
      postalCode,
      country,
      clearEmail,
      clearPhone,
      clearAddress,
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
    if (title !== undefined && title !== '') {
      requestBody.title = title;
    }

    // Handle email - either update, clear, or leave unchanged
    if (clearEmail) {
      requestBody.emails = null;
    } else if (email !== undefined && email !== '') {
      requestBody.emails = [
        {
          email: email,
          category: emailCategory || 'work',
        },
      ];
    }

    // Handle phone number - either update, clear, or leave unchanged
    if (clearPhone) {
      requestBody.phone_numbers = null;
    } else if (phoneNumber !== undefined && phoneNumber !== '') {
      requestBody.phone_numbers = [
        {
          number: phoneNumber,
          category: phoneCategory || 'mobile',
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

    // If no fields are provided, return early
    if (Object.keys(requestBody).length === 0) {
      throw new Error('No fields provided for update. Please specify at least one field to update.');
    }

    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.PUT,
        url: `https://api.copper.com/developer_api/v1/people/${personId}`,
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
        throw new Error(`Person with ID ${personId} not found.`);
      }
      throw new Error(`Error updating person: ${error.message}`);
    }
  },
});
