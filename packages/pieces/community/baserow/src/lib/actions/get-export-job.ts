import { createAction, Property } from '@activepieces/pieces-framework';
import { baserowAuth } from '../auth';
import { makeClient } from '../common';
import { baserowAiHelpers } from '../common/ai-helpers';
import { getExportJobOutputSchema } from '../output-schemas';

export const getExportJobAction = createAction({
  name: 'baserow_get_export_job',
  classification: 'READ',
  outputSchema: getExportJobOutputSchema,
  displayName: 'Get Export Job',
  description: 'Gets the state and download URL of an export job.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns the state (pending, exporting, finished, failed, cancelled), progress and — once finished — the download URL of a Baserow export job started by Export Table. Call again later while the state is pending or exporting; it does not wait. Requires an Email & Password connection. Read-only and idempotent.',
    idempotent: true,
  },
  auth: baserowAuth,
  props: {
    job_id: Property.Number({
      displayName: 'Job ID',
      description: 'The job ID returned by Export Table.',
      required: true,
    }),
  },
  async run(context) {
    const { job_id } = context.propsValue;
    baserowAiHelpers.assertJwt({ auth: context.auth, actionName: 'Get Export Job' });
    const client = await makeClient(context.auth);
    const job = await baserowAiHelpers.execute(() => client.getExportJob({ jobId: job_id }));
    return {
      job_id: job['id'],
      state: job['state'],
      progress_percentage: job['progress_percentage'],
      file_name: job['exported_file_name'],
      url: job['state'] === 'finished' ? job['url'] : null,
    };
  },
});
