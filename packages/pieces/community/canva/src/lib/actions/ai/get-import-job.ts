import { createAction, Property } from '@activepieces/pieces-framework';
import { AnyJob, canvaAuth, canvaCommon } from '../../common';
import { canvaOutputSchemas } from '../../common/output-schemas';

export const canvaGetImportJobAi = createAction({
  auth: canvaAuth,
  name: 'canva_get_import_job',
  displayName: 'Get Import Job',
  description: 'Get Import Job by job ID.',
  audience: 'ai',
  classification: 'READ',
  outputSchema: canvaOutputSchemas.job,
  aiMetadata: {
    description:
      'Checks a design import job started by canva_import_design_from_url. status is in_progress, success or failed. On success, designs holds the new design(s); large files can be split into several designs. On failure, error_code and error_message say why. Wait a few seconds between checks while in_progress.',
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
    const job = await canvaCommon.fetchJob<AnyJob>({ token: context.auth.access_token, kind: 'url_import', jobId });
    return canvaCommon.flattenJob({ kind: 'url_import', job });
  },
});
