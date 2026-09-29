import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { uploadPostAuth } from '../auth';
import { uploadPostClient } from '../common/client';

export const getUploadStatus = createAction({
  auth: uploadPostAuth,
  name: 'get_upload_status',
  classification: 'READ',
  displayName: 'Get Upload Status',
  description:
    'Check the progress and per-platform results of a background or scheduled upload.',
  audience: 'both',
  aiMetadata: {
    description:
      'Get the aggregated status and per-platform results of one upload, by the request ID returned for background uploads or the job ID returned for scheduled posts. Use Get Upload History to browse or filter many past uploads instead. Read-only and safe to retry.',
    idempotent: true,
  },
  props: {
    request_id: Property.ShortText({
      displayName: 'Request ID',
      description:
        'The `request_id` returned by an upload with "Process in Background" enabled.',
      required: false,
    }),
    job_id: Property.ShortText({
      displayName: 'Job ID',
      description: 'The `job_id` returned by a scheduled or queued upload.',
      required: false,
    }),
  },
  async run(context) {
    const { request_id, job_id } = context.propsValue;
    if (!request_id && !job_id) {
      throw new Error('Provide a Request ID or a Job ID.');
    }
    const response = await uploadPostClient.request<UploadStatusResponse>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.GET,
      path: '/uploadposts/status',
      queryParams: uploadPostClient.compactQuery({ request_id, job_id }),
    });
    return response.body;
  },
});

type UploadStatusResponse = {
  request_id?: string;
  job_id?: string;
  external_id?: string | null;
  status?: string;
  completed?: number;
  total?: number;
  results?: {
    platform: string;
    success: boolean;
    message?: string;
    upload_timestamp?: string;
  }[];
  last_update?: string;
};
