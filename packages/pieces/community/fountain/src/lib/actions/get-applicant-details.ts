import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { fountainAuth } from '../../';
import { getAuthHeaders } from '../common/auth';
import { AppConnectionType } from '@activepieces/shared';


export const fountainGetApplicantDetails = createAction({
  name: 'get_applicant_details',
  auth: fountainAuth,
  displayName: 'Get Applicant Details',
  description: 'Get complete applicant information',
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
      method: HttpMethod.GET,
      url: `https://api.fountain.com/v2/applicants/${applicantId}`,
      headers: getAuthHeaders(context.auth),
    });

    return response.body;
  },
});
