import { createAction, Property } from '@activepieces/pieces-framework';
import { AnyJob, canvaAuth, canvaCommon } from '../../common';
import { canvaOutputSchemas } from '../../common/output-schemas';

export const canvaGetExportJobAi = createAction({
  auth: canvaAuth,
  name: 'canva_get_export_job',
  displayName: 'Get Export Job',
  description: 'Get Export Job by job ID.',
  audience: 'ai',
  classification: 'READ',
  outputSchema: canvaOutputSchemas.job,
  aiMetadata: {
    description:
      'Checks an export job started by canva_export_design. status is in_progress, success or failed. On success, urls holds the download links (valid 24 hours, one per page). On failure, error_code and error_message say why. Wait a few seconds between checks while in_progress.',
    idempotent: true,
  },
  props: {
    jobId: Property.ShortText({ displayName: 'Job ID', description: 'The job_id returned when the job was started.', required: true }),
  },
  async run(context) {
    const jobId = context.propsValue.jobId.trim();
    if (!jobId) {
      throw new Error('Job ID is required.');
    }
    const job = await canvaCommon.fetchJob<AnyJob>({ token: context.auth.access_token, kind: 'export', jobId });
    return canvaCommon.flattenJob({ kind: 'export', job });
  },
});
