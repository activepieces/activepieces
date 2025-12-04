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

export const fountainDeleteApplicant = createAction({
  name: 'delete_applicant',
  auth: fountainAuth,
  displayName: 'Delete Applicant',
  description: 'Delete an applicant by their ID',
  props: {
    id: Property.Dropdown({
      auth: fountainAuth,
      displayName: 'Applicant',
      description: 'The applicant to delete (shows 50 most recent applicants)',
      required: true,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) return { disabled: true, options: [], placeholder: 'Connect account first' };
        return { disabled: false, options: await getApplicantsDropdown(auth) };
      },
    }),
  },
  async run(context) {
    const applicantId = context.propsValue.id;

    const response = await httpClient.sendRequest({
      method: HttpMethod.DELETE,
      url: getApiUrl(context.auth, `/applicants/${applicantId}`),
      headers: getAuthHeaders(context.auth),
    });

    return {
      success: response.status === 204,
      status: response.status,
      message: response.status === 204 ? 'Applicant deleted successfully' : 'Failed to delete applicant',
    };
  },
});