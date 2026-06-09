import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';

import { simplyprintAuth } from '../auth';
import { simplyprintClient } from '../common/client';

export const unarchivePrintJobsAction = createAction({
  auth: simplyprintAuth,
  name: 'unarchive_print_jobs',
  displayName: 'Unarchive Print Jobs',
  description: 'Restore one or more archived print jobs to the active history view.',
  props: {
    jobIds: Property.Array({
      displayName: 'Job IDs',
      description: 'Numeric print-job IDs to unarchive.',
      required: true,
    }),
  },
  async run(context) {
    const jobs = (context.propsValue.jobIds ?? []).map(Number).filter((n) => n > 0);
    if (jobs.length === 0) throw new Error('Provide at least one job ID.');

    return await simplyprintClient.simplyprintCall({
      auth: context.auth,
      method: HttpMethod.POST,
      path: 'jobs/Unarchive',
      body: { jobs },
    });
  },
});
