import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { fountainAuth } from '../../';
import { getAuthHeaders, getApiUrl } from '../common/auth';

export const fountainCreateApplicant = createAction({
  name: 'create_applicant',
  auth: fountainAuth,
  displayName: 'Create Applicant',
  description: 'Add a new applicant to your hiring pipeline',
  props: {
    name: Property.ShortText({
      displayName: 'Full Name',
      description: 'Applicant\'s full name',
      required: true,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Applicant\'s email address',
      required: true,
    }),
    phone_number: Property.ShortText({
      displayName: 'Phone Number',
      description: 'Applicant\'s complete phone number',
      required: true,
    }),
    check_if_applicant_is_duplicate: Property.Checkbox({
      displayName: 'Check for Duplicates',
      description: 'Apply additional duplicate applicant blocking rules specified in company duplicate settings',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const requestBody = {
      name: context.propsValue.name,
      email: context.propsValue.email,
      phone_number: context.propsValue.phone_number,
      check_if_applicant_is_duplicate: context.propsValue.check_if_applicant_is_duplicate,
    };

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: getApiUrl(context.auth, '/applicants'),
      headers: getAuthHeaders(context.auth),
      body: requestBody,
    });

    return response.body;
  },
});
