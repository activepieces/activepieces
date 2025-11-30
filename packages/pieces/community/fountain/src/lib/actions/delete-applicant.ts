import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { fountainAuth } from '../../';
import { getAuthHeaders } from '../common/auth';



export const fountainDeleteApplicant = createAction({
  name: 'delete_applicant',
  auth: fountainAuth,
  displayName: 'Delete Applicant',
  description: 'Delete an applicant by their ID',
  props: {
    id: Property.Dropdown({
      displayName: 'Applicant',
      description: 'The applicant to delete (shows 50 most recent applicants)',
      required: true,
      refreshers: [],
      auth: fountainAuth,
      options: async ({ auth }) => {
        if (!auth) return { disabled: true, options: [], placeholder: 'Connect account first' };
        const response = await httpClient.sendRequest({
          method: HttpMethod.GET,
          url: 'https://api.fountain.com/v2/applicants',
          headers: getAuthHeaders(auth),
          queryParams: { per_page: '50' },
        });
    
        const applicants = response.body?.applicants || [];
        const options = applicants.map((applicant: any) => ({
          label: `${applicant.name} (${applicant.email})`,
          value: applicant.id,
        }));
        return { disabled: false, options };
      },
    }),
  },
  async run(context) {
    const applicantId = context.propsValue.id;

    const response = await httpClient.sendRequest({
      method: HttpMethod.DELETE,
      url: `https://api.fountain.com/v2/applicants/${applicantId}`,
      headers: getAuthHeaders(context.auth),
    });

    return {
      success: response.status === 204,
      status: response.status,
      message: response.status === 204 ? 'Applicant deleted successfully' : 'Failed to delete applicant',
    };
  },
});
