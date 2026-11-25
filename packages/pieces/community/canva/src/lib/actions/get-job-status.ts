import { createAction, Property } from '@activepieces/pieces-framework';
import { AnyJob, canvaAuth, canvaCommon, JobKind } from '../common';
import { canvaOutputSchemas } from '../common/output-schemas';

export const getJobStatus = createAction({
  auth: canvaAuth,
  name: 'get_job_status',
  classification: 'READ',
  displayName: 'Get Job Status',
  description: 'Check an export, upload or import job and get its result (download links, asset or designs).',
  audience: 'human',
  aiMetadata: {
    description: 'Checks a Canva async job. Human step; agents use canva_get_export_job, canva_get_asset_upload_job or canva_get_import_job. Read-only.',
    idempotent: true,
  },
  outputSchema: canvaOutputSchemas.job,
  props: {
    jobType: Property.StaticDropdown({
      displayName: 'Job Type',
      description: 'The action that started the job.',
      required: true,
      options: {
        options: [
          { label: 'Export Design', value: 'export' },
          { label: 'Upload Asset (file)', value: 'asset_upload' },
          { label: 'Upload Asset (URL)', value: 'url_asset_upload' },
          { label: 'Import Design (file)', value: 'import' },
          { label: 'Import Design (URL)', value: 'url_import' },
        ],
      },
    }),
    jobId: Property.ShortText({
      displayName: 'Job ID',
      description: 'The job ID returned by the action that started the job.',
      required: true,
    }),
  },
  async run(context) {
    const kind = toJobKind(context.propsValue.jobType);
    const jobId = context.propsValue.jobId.trim();
    if (!jobId) {
      throw new Error('Job ID is required.');
    }
    const job = await canvaCommon.fetchJob<AnyJob>({ token: context.auth.access_token, kind, jobId });
    return canvaCommon.flattenJob({ kind, job });
  },
});

function toJobKind(value: string): JobKind {
  switch (value) {
    case 'export':
    case 'asset_upload':
    case 'url_asset_upload':
    case 'import':
    case 'url_import':
      return value;
    default:
      throw new Error(`Unknown job type "${value}".`);
  }
}
