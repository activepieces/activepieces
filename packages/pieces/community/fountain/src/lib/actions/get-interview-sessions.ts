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

export const fountainGetInterviewSessions = createAction({
  name: 'get_interview_sessions',
  auth: fountainAuth,
  displayName: 'Get Interview Sessions',
  description: 'Returns the applicant\'s interview sessions',
  props: {
    id: Property.Dropdown({
      displayName: 'Applicant',
      description: 'The applicant to get interview sessions for (shows 50 most recent applicants)',
      required: true,
      refreshers: [],
      auth: fountainAuth,
      options: async ({ auth }) => {
        if (!auth) return { disabled: true, options: [], placeholder: 'Connect account first' };
        return { disabled: false, options: await getApplicantsDropdown(auth as any) };
      },
    }),
  },
  async run(context) {
    const applicantId = context.propsValue.id;

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: getApiUrl(context.auth, `/applicants/${applicantId}/booked_slots`),
      headers: getAuthHeaders(context.auth),
    });

    return response.body;
  },
});
