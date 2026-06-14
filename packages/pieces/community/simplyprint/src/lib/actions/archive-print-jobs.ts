import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';

import { simplyprintAuth } from '../auth';
import { simplyprintClient } from '../common/client';

export const archivePrintJobsAction = createAction({
  auth: simplyprintAuth,
  name: 'archive_print_jobs',
  displayName: 'Archive Print Jobs',
  description: 'Archive one or more completed print jobs (removes them from the active history view).',
  audience: 'both',
  aiMetadata: {
    description:
      'Archive one or more completed print jobs by ID, removing them from the active history view, with an optional reason note. Use this to clean up finished jobs from the working history; archiving an already-archived job has no further effect, so the state change is idempotent per job.',
    idempotent: true,
  },
  props: {
    jobIds: Property.Array({
      displayName: 'Job IDs',
      description: 'Numeric print-job IDs to archive.',
      required: true,
    }),
    reason: Property.LongText({
      displayName: 'Reason (optional)',
      description: 'Optional note explaining why the jobs were archived (max 500 chars).',
      required: false,
    }),
  },
  async run(context) {
    const jobs = (context.propsValue.jobIds ?? []).map(Number).filter((n) => n > 0);
    if (jobs.length === 0) throw new Error('Provide at least one job ID.');

    const body: Record<string, unknown> = { jobs };
    if (context.propsValue.reason) body['reason'] = context.propsValue.reason;

    return await simplyprintClient.simplyprintCall({
      auth: context.auth,
      method: HttpMethod.POST,
      path: 'jobs/Archive',
      body,
    });
  },
});
