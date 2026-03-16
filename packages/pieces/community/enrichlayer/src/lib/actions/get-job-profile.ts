import { createAction, Property } from '@activepieces/pieces-framework';
import { enrichlayerAuth } from '../auth';
import { enrichlayerApiCall } from '../common/client';
import { ENDPOINTS } from '../common/constants';

export const getJobProfile = createAction({
  name: 'get_job_profile',
  auth: enrichlayerAuth,
  displayName: 'Get Job Profile',
  description:
    'Get structured data of a job posting (2 credits)',
  props: {
    url: Property.ShortText({
      displayName: 'Job URL',
      description:
        'Professional network job URL (e.g., https://www.linkedin.com/jobs/view/4222036951/)',
      required: true,
    }),
  },
  async run(context) {
    return await enrichlayerApiCall(
      context.auth.secret_text as string,
      ENDPOINTS.JOB_PROFILE,
      {
        url: context.propsValue.url,
      },
    );
  },
});
