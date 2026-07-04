import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { descriptAuth } from '../auth';
import { descriptCommon } from '../common';

type JobResult = {
  status?: string;
  agent_response?: string;
  project_changed?: boolean;
  media_seconds_used?: number;
  ai_credits_used?: number;
  share_url?: string;
  download_url?: string;
  download_url_expires_at?: string;
  error_message?: string;
};

type JobStatusResponse = {
  job_id: string;
  job_type: string;
  job_state: 'queued' | 'running' | 'stopped' | 'cancelled';
  created_at: string;
  stopped_at?: string;
  drive_id: string;
  project_id: string;
  project_url: string;
  result?: JobResult;
  progress?: { label: string; percent?: number; last_update_at?: string };
};

export const descriptGetJobStatusAction = createAction({
  auth: descriptAuth,
  name: 'get_job_status',
  displayName: 'Get Job Status',
  description:
    'Retrieves the current status of a Descript background job (import, agent edit, or publish). Use the job_id returned by any job-creation action.',
  audience: 'both',
  aiMetadata: { description: 'Looks up the current state and result of a single Descript background job (import, agent edit, or publish) by its job_id. Use to poll for completion after starting an asynchronous job and to read outputs such as share/download URLs or error messages. Read-only and idempotent.', idempotent: true },
  props: {
    job_id: Property.ShortText({
      displayName: 'Job ID',
      description:
        'The job ID returned when you created the job (e.g. from "Import Media", "Agent Edit", or "Publish Project" actions).',
      required: true,
    }),
  },
  async run(context) {
    const response = await descriptCommon.descriptApiCall<JobStatusResponse>({
      apiKey: descriptCommon.getAuthToken(context.auth),
      method: HttpMethod.GET,
      path: `/jobs/${context.propsValue.job_id}`,
    });

    return response.body;
  },
});
