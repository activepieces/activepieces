import { createAction, Property } from '@activepieces/pieces-framework';
import { helpScoutApi } from '../common/api';
import { helpScoutOutputSchemas } from '../common/output-schemas';
import { helpScoutAuth } from '../common/auth';
import { propsValidation } from '@activepieces/pieces-common';
import * as z from 'zod/mini'
import { HttpMethod } from '@activepieces/pieces-common';

export const createCustomer = createAction({
  auth: helpScoutAuth,
  name: 'create_customer',
  classification: 'WRITE',
  displayName: 'Create Customer',
  description: 'Adds a new customer to Help Scout.',
  audience: 'both',
  aiMetadata: {
    description:
      'Creates a new customer record in Help Scout from an email plus optional profile details (name, phone, organization, social profiles, etc.). Use to register a contact before associating conversations. Email is required and must be valid; not idempotent — each call creates a new customer even if one already exists for that email, so look the customer up first if duplicates matter.',
    idempotent: false,
  },
  outputSchema: helpScoutOutputSchemas['createdId'],
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
      email: z.string().check(z.email('Please provide a valid email address.')),
      firstName: z.optional(z.string()),
      lastName: z.optional(z.string()),
      phone: z.optional(z.string()),
      photoUrl: z.optional(z.string().check(z.url('Photo URL must be a valid URL.'))),
      jobTitle: z.optional(z.string()),
      location: z.optional(z.string()),
      background: z.optional(z.string()),
      age: z.optional(z.string()),
      gender: z.optional(z.enum(['male', 'female', 'unknown'])),
      organization: z.optional(z.string()),
      socialProfiles: z.optional(z.array(z.string().check(z.url('Each social profile must be a valid URL.')))),
    });
    const body: Record<string, unknown> = {
      emails: [{ value: propsValue.email, type: 'work' }],
    };
    if (propsValue.firstName) body['firstName'] = propsValue.firstName;
    if (propsValue.lastName) body['lastName'] = propsValue.lastName;
    if (propsValue.phone) body['phones'] = [{ value: propsValue.phone, type: 'work' }];
    if (propsValue.photoUrl) body['photoUrl'] = propsValue.photoUrl;
    if (propsValue.jobTitle) body['jobTitle'] = propsValue.jobTitle;
    if (propsValue.location) body['location'] = propsValue.location;
    if (propsValue.background) body['background'] = propsValue.background;
    if (propsValue.age) body['age'] = propsValue.age;
    if (propsValue.gender) body['gender'] = propsValue.gender;
    if (propsValue.organization) body['organization'] = propsValue.organization;
    const socialProfiles = helpScoutApi.toStringList(propsValue.socialProfiles);
    if (socialProfiles.length > 0) {
      body['socialProfiles'] = socialProfiles.map((url) => ({ value: url, type: 'other' }));
    }
    const response = await helpScoutApi.request({
      method: HttpMethod.POST,
      path: '/customers',
      auth,
      body,
    });
    return { id: helpScoutApi.getResourceId(response.headers) };
  },
});
