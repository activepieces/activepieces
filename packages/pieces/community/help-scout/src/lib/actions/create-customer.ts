import { createAction, Property } from '@activepieces/pieces-framework';
import { helpScoutApiRequest } from '../common/api';
import { helpScoutAuth } from '../common/auth';
import { propsValidation } from '@activepieces/pieces-common';
import { z } from 'zod';
import { HttpMethod } from '@activepieces/pieces-common';
import { HttpStatusCode } from 'axios';

export const createCustomer = createAction({
  auth: helpScoutAuth,
  name: 'create_customer',
  displayName: 'Create Customer',
  description: 'Adds a new customer to Help Scout.',
  props: {
    email: Property.ShortText({
      displayName: 'Email',
      required: true,
    }),
    firstName: Property.ShortText({
      displayName: 'First Name',
      required: false,
    }),
    lastName: Property.ShortText({
      displayName: 'Last Name',
      required: false,
    }),
    phone: Property.ShortText({
      displayName: 'Phone',
      required: false,
    }),
    photoUrl: Property.ShortText({
      displayName: 'Photo URL',
      required: false,
    }),
    jobTitle: Property.ShortText({
      displayName: 'Job Title',
      required: false,
    }),
    location: Property.ShortText({
      displayName: 'Location',
      required: false,
    }),
    background: Property.LongText({
      displayName: 'Background',
      required: false,
    }),
    age: Property.ShortText({
      displayName: 'Age',
      required: false,
      description: 'Customer’s age (string, e.g. "30-35")',
    }),
    gender: Property.StaticDropdown({
      displayName: 'Gender',
      required: false,
      options: {
        options: [
          { label: 'Male', value: 'male' },
          { label: 'Female', value: 'female' },
          { label: 'Unknown', value: 'unknown' },
        ],
      },
    }),
    organization: Property.ShortText({
      displayName: 'Organization',
      required: false,
    }),
    socialProfiles: Property.Array({
      displayName: 'Social Profile URLs',
      required: false,
      description: 'URLs for social profiles (type will be set to "other")',
    }),
  },
  async run({ auth, propsValue }){
    await propsValidation.validateZod(propsValue, {
      email: z.string().email('Please provide a valid email address.'),
      firstName: z.string().optional(),
      lastName: z.string().optional(),
      phone: z.string().optional(),
      photoUrl: z.string().url('Photo URL must be a valid URL.').optional(),
      jobTitle: z.string().optional(),
      location: z.string().optional(),
      background: z.string().optional(),
      age: z.string().optional(),
      gender: z.enum(['male', 'female', 'unknown']).optional(),
      organization: z.string().optional(),
      socialProfiles: z.array(z.string().url('Each social profile must be a valid URL.')).optional(),
    });
    const payload: Record<string, any> = {
      emails: [{ value: propsValue.email, type: 'work' }],
      firstName: propsValue.firstName,
      lastName: propsValue.lastName,
      phones: propsValue.phone ? [{ value: propsValue.phone, type: 'work' }] : undefined,
      photoUrl: propsValue.photoUrl,
      jobTitle: propsValue.jobTitle,
      location: propsValue.location,
      background: propsValue.background,
      age: propsValue.age,
      gender: propsValue.gender,
      organization: propsValue.organization,
      socialProfiles: Array.isArray(propsValue.socialProfiles)
        ? propsValue.socialProfiles.filter((url): url is string => typeof url === 'string').map((url) => ({ value: url, type: 'other' }))
        : undefined,
    };
    Object.keys(payload).forEach((key) => {
      if (payload[key] === undefined || payload[key] === null) {
        delete payload[key];
      }
    });
    const response =  await helpScoutApiRequest({
      method: HttpMethod.POST,
      url: '/customers',
      auth,
      body: payload,
    });

    const customerId = response.headers?.['resource-id'];

    return {
      id:customerId
    }
  },
}); 