import { AppConnectionValueForAuthProperty, createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { fountainAuth } from '../../';
import { getAuthHeaders, getApiUrl } from '../common/auth';

async function getApplicantsDropdown(auth: AppConnectionValueForAuthProperty<typeof fountainAuth>): Promise<{ label: string; value: string }[]> {
  try {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: getApiUrl(auth, '/applicants'),
      headers: getAuthHeaders(auth),
      queryParams: { per_page: '50' },
    });

    const applicants = response.body?.applicants || [];
    return applicants.map((applicant: any) => ({
      label: `${applicant.name} (${applicant.email})`,
      value: applicant.id,
    }));
  } catch (error) {
    return [];
  }
}

export const fountainUpdateApplicant = createAction({
  name: 'update_applicant',
  auth: fountainAuth,
  displayName: 'Update Applicant Info',
  description: 'Update an applicant\'s information',
  props: {
    id: Property.Dropdown({
      displayName: 'Applicant',
      description: 'The applicant to update (shows 50 most recent applicants)',
      required: true,
      refreshers: [],
      auth: fountainAuth,
      options: async ({ auth }) => {
        if (!auth) return { disabled: true, options: [], placeholder: 'Connect account first' };
        return { disabled: false, options: await getApplicantsDropdown(auth as any) };
      },
    }),
    name: Property.ShortText({
      displayName: 'Name',
      description: 'Applicant\'s full name',
      required: false,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Applicant\'s email address',
      required: false,
    }),
    phone_number: Property.ShortText({
      displayName: 'Phone Number',
      description: 'Applicant\'s complete phone number',
      required: false,
    }),
    data: Property.Object({
      displayName: 'Custom Data',
      description: 'Custom data fields to update (key-value pairs)',
      required: false,
    }),
    secure_data: Property.Object({
      displayName: 'Secure Data',
      description: 'Secure data fields to update (key-value pairs like SSN, etc.)',
      required: false,
    }),
    rejection_reason: Property.ShortText({
      displayName: 'Rejection Reason',
      description: 'Manually set reason for rejection',
      required: false,
    }),
  },
  async run(context) {
    const applicantId = context.propsValue.id;

    const requestBody: Record<string, any> = {};

    if (context.propsValue['name']) requestBody['name'] = context.propsValue['name'];
    if (context.propsValue['email']) requestBody['email'] = context.propsValue['email'];
    if (context.propsValue['phone_number']) requestBody['phone_number'] = context.propsValue['phone_number'];
    if (context.propsValue['data']) requestBody['data'] = context.propsValue['data'];
    if (context.propsValue['secure_data']) requestBody['secure_data'] = context.propsValue['secure_data'];
    if (context.propsValue['rejection_reason']) requestBody['rejection_reason'] = context.propsValue['rejection_reason'];

    const response = await httpClient.sendRequest({
      method: HttpMethod.PUT,
      url: getApiUrl(context.auth, `/applicants/${applicantId}`),
      headers: getAuthHeaders(context.auth),
      body: requestBody,
    });

    return response.body;
  },
});
