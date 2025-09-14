import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { magicalApiAuth } from '../common/auth';
import { magicalApiCall } from '../common/client';

export const getProfileData = createAction({
  auth: magicalApiAuth,
  name: 'get_profile_data',
  displayName: 'Get Profile Data',
  description: 'Given a person identifier (name, email, LinkedIn URL), retrieve profile metadata.',
  props: {
    identifier_type: Property.StaticDropdown({
      displayName: 'Identifier Type',
      description: 'The type of identifier to use for profile lookup',
      required: true,
      options: {
        options: [
          { label: 'Email Address', value: 'email' },
          { label: 'Full Name', value: 'name' },
          { label: 'LinkedIn URL', value: 'linkedin_url' },
          { label: 'LinkedIn Profile ID', value: 'linkedin_id' },
          { label: 'Phone Number', value: 'phone' },
        ],
      },
    }),
    identifier_value: Property.ShortText({
      displayName: 'Identifier Value',
      description: 'The actual value of the identifier (email, name, URL, etc.)',
      required: true,
    }),
    additional_name: Property.ShortText({
      displayName: 'Additional Name',
      description: 'Additional name information to help with matching (optional)',
      required: false,
    }),
    company_name: Property.ShortText({
      displayName: 'Company Name',
      description: 'Company name to help with matching (optional)',
      required: false,
    }),
    include_social_profiles: Property.Checkbox({
      displayName: 'Include Social Profiles',
      description: 'Include social media profiles in the response',
      required: false,
      defaultValue: true,
    }),
    include_work_history: Property.Checkbox({
      displayName: 'Include Work History',
      description: 'Include work history information in the response',
      required: false,
      defaultValue: true,
    }),
    include_education: Property.Checkbox({
      displayName: 'Include Education',
      description: 'Include education information in the response',
      required: false,
      defaultValue: true,
    }),
    include_skills: Property.Checkbox({
      displayName: 'Include Skills',
      description: 'Include skills information in the response',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const { auth } = context;
    const {
      identifier_type,
      identifier_value,
      additional_name,
      company_name,
      include_social_profiles,
      include_work_history,
      include_education,
      include_skills,
    } = context.propsValue;

    const requestBody: any = {
      identifier_type,
      identifier_value,
      include_social_profiles,
      include_work_history,
      include_education,
      include_skills,
    };

    if (additional_name) {
      requestBody.additional_name = additional_name;
    }

    if (company_name) {
      requestBody.company_name = company_name;
    }

    const result = await magicalApiCall({
      apiKey: auth,
      method: HttpMethod.POST,
      endpoint: '/profile/lookup',
      body: requestBody,
    });

    return result;
  },
});
