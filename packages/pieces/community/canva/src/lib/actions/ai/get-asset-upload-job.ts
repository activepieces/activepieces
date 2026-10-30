import { createAction, Property } from '@activepieces/pieces-framework';
import { AnyJob, canvaAuth, canvaCommon } from '../../common';
import { canvaOutputSchemas } from '../../common/output-schemas';

export const canvaGetAssetUploadJobAi = createAction({
  auth: canvaAuth,
  name: 'canva_get_asset_upload_job',
  displayName: 'Get Asset Upload Job',
  description: 'Get Asset Upload Job by job ID.',
  audience: 'ai',
  classification: 'READ',
  outputSchema: canvaOutputSchemas.job,
  aiMetadata: {
    description:
      'Checks an asset upload job started by canva_upload_asset_from_url. status is in_progress, success or failed. On success, asset holds the new asset with its ID. On failure, error_code and error_message say why. Wait a few seconds between checks while in_progress.',
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
    const job = await canvaCommon.fetchJob<AnyJob>({ token: context.auth.access_token, kind: 'url_asset_upload', jobId });
    return canvaCommon.flattenJob({ kind: 'url_asset_upload', job });
  },
});
