import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { pubrioAuth } from '../../index';
import { pubrioRequest } from '../common';

export const lookupJob = createAction({
  auth: pubrioAuth,
  name: 'lookup_job',
  displayName: 'Lookup Job',
  description: 'Look up detailed job information by job search ID',
  props: {
    job_search_id: Property.ShortText({
      displayName: 'Job Search ID',
      required: true,
      description: 'The job search ID to look up',
    }),
  },
  async run(context) {
    const body: Record<string, unknown> = {
      job_search_id: context.propsValue.job_search_id,
    };
    return await pubrioRequest(
      context.auth.secret_text,
      HttpMethod.POST,
      '/companies/jobs/lookup',
      body
    );
  },
});
