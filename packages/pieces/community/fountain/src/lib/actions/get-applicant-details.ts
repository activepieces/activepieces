import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { fountainAuth } from '../../';
import { getAuthHeaders } from '../common/auth';
import { AppConnectionType } from '@activepieces/shared';

async function getApplicantsDropdown(auth: string): Promise<{ label: string; value: string }[]> {
  try {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.fountain.com/v2/applicants',
      headers: getAuthHeaders({secret_text: auth, type: AppConnectionType.SECRET_TEXT}),
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

export const fountainGetApplicantDetails = createAction({
  name: 'get_applicant_details',
  auth: fountainAuth,
  displayName: 'Get Applicant Details',
  description: 'Get complete applicant information',
  props: {
    id: Property.Dropdown({
      displayName: 'Applicant',
      description: 'The applicant to retrieve details for (shows 50 most recent applicants)',
      required: true,
      auth: fountainAuth,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) return { disabled: true, options: [], placeholder: 'Connect account first' };
        return { disabled: false, options: await getApplicantsDropdown(auth.secret_text) };
      },
    }),
  },
  async run(context) {
    const applicantId = context.propsValue.id;

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `https://api.fountain.com/v2/applicants/${applicantId}`,
      headers: getAuthHeaders(context.auth),
    });

    return response.body;
  },
});
