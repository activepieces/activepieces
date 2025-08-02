import { createAction, Property } from '@activepieces/pieces-framework';
import { helpScoutAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const createCustomer = createAction({
  auth: helpScoutAuth,
  name: 'createCustomer',
  displayName: 'Create Customer',
  description: '',
  props: {
    firstName: Property.ShortText({
      displayName: 'First Name',
      description: 'First name of the customer (1-40 characters)',
      required: false,
    }),
    lastName: Property.ShortText({
      displayName: 'Last Name',
      description: 'Last name of the customer (1-40 characters)',
      required: false,
    }),
    phone: Property.ShortText({
      displayName: 'Phone',
      description: 'Phone number for the customer',
      required: false,
    }),
    photoUrl: Property.ShortText({
      displayName: 'Photo URL',
      description: 'URL of the customer’s photo (max 200 characters)',
      required: false,
    }),
    jobTitle: Property.ShortText({
      displayName: 'Job Title',
      description: 'Job title (max 60 characters)',
      required: false,
    }),
    photoType: Property.StaticDropdown({
      displayName: 'Photo Type',
      description: 'Type of photo',
      required: false,
      options: {
        options: [
          { label: 'Unknown', value: 'unknown' },
          { label: 'Gravatar', value: 'gravatar' },
          { label: 'Twitter', value: 'twitter' },
          { label: 'Facebook', value: 'facebook' },
          { label: 'Google Profile', value: 'googleprofile' },
          { label: 'Google Plus', value: 'googleplus' },
          { label: 'LinkedIn', value: 'linkedin' },
          { label: 'Instagram', value: 'instagram' },
        ],
      },
    }),
    background: Property.LongText({
      displayName: 'Background/Notes',
      description: 'Notes about the customer (max 200 characters)',
      required: false,
    }),
    location: Property.ShortText({
      displayName: 'Location',
      description: 'Location (max 60 characters)',
      required: false,
    }),
    organization: Property.ShortText({
      displayName: 'Organization',
      description: 'Organization (max 60 characters)',
      required: false,
    }),
    gender: Property.StaticDropdown({
      displayName: 'Gender',
      description: 'Gender of the customer',
      required: false,
      options: {
        options: [
          { label: 'Male', value: 'male' },
          { label: 'Female', value: 'female' },
          { label: 'Unknown', value: 'unknown' },
        ],
      },
    }),
    age: Property.ShortText({
      displayName: 'Age',
      description: 'Customer’s age',
      required: false,
    }),
    emails: Property.Array({
      displayName: 'Emails',
      description: 'List of email entries',
      required: false,
      properties: {
        type: Property.ShortText({
          displayName: 'Type',
          description: 'Type of email (e.g., work, home)',
          required: false,
        }),
        value: Property.ShortText({
          displayName: 'Email Address',
          required: true,
        }),
      },
    }),
    phones: Property.Array({
      displayName: 'Phones',
      description: 'List of phone entries',
      required: false,
      properties: {
        type: Property.ShortText({
          displayName: 'Type',
          description: 'Type of phone (e.g., work, home)',
          required: false,
        }),
        value: Property.ShortText({
          displayName: 'Phone Number',
          required: true,
        }),
      },
    }),

    socialProfiles: Property.Array({
      displayName: 'Social Profiles',
      description: 'List of social profiles',
      required: false,
      properties: {
        type: Property.StaticDropdown({
          displayName: 'Type',
          required: true,
          options: {
            options: [
              { label: 'About.me', value: 'aboutme' },
              { label: 'Facebook', value: 'facebook' },
              { label: 'Flickr', value: 'flickr' },
              { label: 'Foursquare', value: 'foursquare' },
              { label: 'Google', value: 'google' },
              { label: 'Google Plus', value: 'googleplus' },
              { label: 'LinkedIn', value: 'linkedin' },
              { label: 'Other', value: 'other' },
              { label: 'Quora', value: 'quora' },
              { label: 'Tungle.me', value: 'tungleme' },
              { label: 'Twitter', value: 'twitter' },
              { label: 'YouTube', value: 'youtube' },
            ],
          },
        }),
        value: Property.ShortText({
          displayName: 'Social Profile Handle or URL',
          required: true,
        }),
      },
    }),
    websites: Property.Array({
      displayName: 'Websites',
      description: 'List of websites',
      required: false,
      properties: {
        value: Property.ShortText({
          displayName: 'Website URL',
          required: true,
        }),
      },
    }),
    address: Property.Object({
      displayName: 'Address',
      description: 'Customer address',
      required: false,
    }),

  },
  async run({ auth, propsValue }) {
    const payload: Record<string, any> = {};
    if (propsValue['firstName']) payload['firstName'] = propsValue['firstName'];
    if (propsValue['lastName']) payload['lastName'] = propsValue['lastName'];
    if (propsValue['phone']) payload['phone'] = propsValue['phone'];
    if (propsValue['photoUrl']) payload['photoUrl'] = propsValue['photoUrl'];
    if (propsValue['jobTitle']) payload['jobTitle'] = propsValue['jobTitle'];
    if (propsValue['photoType']) payload['photoType'] = propsValue['photoType'];
    if (propsValue['background']) payload['background'] = propsValue['background'];
    if (propsValue['location']) payload['location'] = propsValue['location'];
    if (propsValue['organization']) payload['organization'] = propsValue['organization'];
    if (propsValue['gender']) payload['gender'] = propsValue['gender'];
    if (propsValue['age']) payload['age'] = propsValue['age'];
    if (propsValue['emails'] && propsValue['emails'].length > 0) payload['emails'] = propsValue['emails'];
    if (propsValue['phones'] && propsValue['phones'].length > 0) payload['phones'] = propsValue['phones'];
    if (propsValue['socialProfiles'] && propsValue['socialProfiles'].length > 0) payload['socialProfiles'] = propsValue['socialProfiles'];
    if (propsValue['websites'] && propsValue['websites'].length > 0) payload['websites'] = propsValue['websites'];
    if (propsValue['address'] && Object.keys(propsValue['address']).length > 0) payload['address'] = propsValue['address'];

    const response = await makeRequest(auth.access_token, HttpMethod.POST, '/customers', payload);
    return {
      success: true,
      message: "Cusotmer created",
      data: response
    }
  },
});
