import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { helpScoutAuth } from '../auth';
import { helpScoutCommon } from '../common/client';
import { Customer } from '../common/types';

export const createCustomer = createAction({
  auth: helpScoutAuth,
  name: 'create-customer',
  displayName: 'Create Customer',
  description: 'Creates a new customer in Help Scout',
  props: {
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Customer email address',
      required: true,
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
    emails: Property.Array({
      displayName: 'Additional Emails',
      description: 'Additional email addresses',
      required: false,
    }),
    phones: Property.Array({
      displayName: 'Phone Numbers',
      description: 'Phone numbers',
      required: false,
    }),
    websites: Property.Array({
      displayName: 'Websites',
      description: 'Website URLs',
      required: false,
    }),
    socialProfiles: Property.Array({
      displayName: 'Social Profiles',
      description: 'Social media profiles',
      required: false,
    }),
    properties: Property.Object({
      displayName: 'Custom Properties',
      description: 'Custom customer properties',
      required: false,
    }),
  },
  async run(context) {
    const {
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
      emails,
      phones,
      websites,
      socialProfiles,
      properties,
    } = context.propsValue;

    // Prepare customer data
    const customerData: any = {
      email,
    };

    // Add optional fields
    if (firstName) customerData.firstName = firstName;
    if (lastName) customerData.lastName = lastName;
    if (gender) customerData.gender = gender;
    if (age) customerData.age = age;
    if (organization) customerData.organization = organization;
    if (jobTitle) customerData.jobTitle = jobTitle;
    if (location) customerData.location = location;
    if (timezone) customerData.timezone = timezone;
    if (background) customerData.background = background;
    if (address) customerData.address = address;
    if (properties) customerData.properties = properties;

    // Add contact information
    if (emails && emails.length > 0) {
      customerData.emails = emails.map((email: any) => {
        if (typeof email === 'string') {
          return { value: email, type: 'work' };
        }
        return email;
      });
    }

    if (phones && phones.length > 0) {
      customerData.phones = phones.map((phone: any) => {
        if (typeof phone === 'string') {
          return { value: phone, type: 'work' };
        }
        return phone;
      });
    }

    if (websites && websites.length > 0) {
      customerData.websites = websites.map((website: any) => {
        if (typeof website === 'string') {
          return { value: website };
        }
        return website;
      });
    }

    if (socialProfiles && socialProfiles.length > 0) {
      customerData.socialProfiles = socialProfiles;
    }

    try {
      const customer = await helpScoutCommon.makeRequest(
        context.auth,
        HttpMethod.POST,
        '/customers',
        customerData
      );

      return {
        success: true,
        customer,
      };
    } catch (error) {
      throw new Error(`Failed to create customer: ${error}`);
    }
  },
});