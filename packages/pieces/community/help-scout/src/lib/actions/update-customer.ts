import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { helpScoutAuth } from '../auth';
import { helpScoutCommon } from '../common/client';
import { Customer } from '../common/types';

export const updateCustomer = createAction({
  auth: helpScoutAuth,
  name: 'update-customer',
  displayName: 'Update Customer Properties',
  description: 'Updates properties and custom fields of an existing customer',
  props: {
    customerId: Property.ShortText({
      displayName: 'Customer ID',
      description: 'ID of the customer to update',
      required: true,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Customer email address',
      required: false,
    }),
    firstName: Property.ShortText({
      displayName: 'First Name',
      description: 'Customer first name',
      required: false,
    }),
    lastName: Property.ShortText({
      displayName: 'Last Name',
      description: 'Customer last name',
      required: false,
    }),
    gender: Property.StaticDropdown({
      displayName: 'Gender',
      description: 'Customer gender',
      required: false,
      options: {
        options: [
          { label: 'Male', value: 'male' },
          { label: 'Female', value: 'female' },
          { label: 'Unknown', value: 'unknown' },
        ],
      },
    }),
    age: Property.StaticDropdown({
      displayName: 'Age',
      description: 'Customer age range',
      required: false,
      options: {
        options: [
          { label: 'Under 18', value: 'under-18' },
          { label: '18-24', value: '18-24' },
          { label: '25-34', value: '25-34' },
          { label: '35-44', value: '35-44' },
          { label: '45-54', value: '45-54' },
          { label: '55-64', value: '55-64' },
          { label: '65+', value: '65-plus' },
        ],
      },
    }),
    organization: Property.ShortText({
      displayName: 'Organization',
      description: 'Customer organization',
      required: false,
    }),
    jobTitle: Property.ShortText({
      displayName: 'Job Title',
      description: 'Customer job title',
      required: false,
    }),
    location: Property.ShortText({
      displayName: 'Location',
      description: 'Customer location',
      required: false,
    }),
    timezone: Property.ShortText({
      displayName: 'Timezone',
      description: 'Customer timezone (e.g., America/New_York)',
      required: false,
    }),
    background: Property.LongText({
      displayName: 'Background',
      description: 'Customer background information',
      required: false,
    }),
    address: Property.Object({
      displayName: 'Address',
      description: 'Customer address',
      required: false,
    }),
    properties: Property.Object({
      displayName: 'Custom Properties',
      description: 'Custom customer properties to update',
      required: false,
    }),
    updateMode: Property.StaticDropdown({
      displayName: 'Update Mode',
      description: 'How to handle the update',
      required: false,
      defaultValue: 'merge',
      options: {
        options: [
          { label: 'Merge (update only provided fields)', value: 'merge' },
          { label: 'Replace (replace all fields)', value: 'replace' },
        ],
      },
    }),
  },
  async run(context) {
    const {
      customerId,
      email,
      firstName,
      lastName,
      gender,
      age,
      organization,
      jobTitle,
      location,
      timezone,
      background,
      address,
      properties,
      updateMode,
    } = context.propsValue;

    // Prepare customer data
    const customerData: any = {};

    // Add only provided fields
    if (email !== undefined) customerData.email = email;
    if (firstName !== undefined) customerData.firstName = firstName;
    if (lastName !== undefined) customerData.lastName = lastName;
    if (gender !== undefined) customerData.gender = gender;
    if (age !== undefined) customerData.age = age;
    if (organization !== undefined) customerData.organization = organization;
    if (jobTitle !== undefined) customerData.jobTitle = jobTitle;
    if (location !== undefined) customerData.location = location;
    if (timezone !== undefined) customerData.timezone = timezone;
    if (background !== undefined) customerData.background = background;
    if (address !== undefined) customerData.address = address;
    if (properties !== undefined) customerData.properties = properties;

    // If no data to update, return error
    if (Object.keys(customerData).length === 0) {
      throw new Error('No fields provided to update');
    }

    try {
      // Get current customer data if merge mode
      if (updateMode === 'merge') {
        const currentCustomer = await helpScoutCommon.makeRequest(
          context.auth,
          HttpMethod.GET,
          `/customers/${customerId}`
        );

        // Merge properties if both exist
        if (properties && currentCustomer.properties) {
          customerData.properties = {
            ...currentCustomer.properties,
            ...properties,
          };
        }
      }

      const customer = await helpScoutCommon.makeRequest(
        context.auth,
        HttpMethod.PUT,
        `/customers/${customerId}`,
        customerData
      );

      return {
        success: true,
        customer,
      };
    } catch (error) {
      throw new Error(`Failed to update customer: ${error}`);
    }
  },
});