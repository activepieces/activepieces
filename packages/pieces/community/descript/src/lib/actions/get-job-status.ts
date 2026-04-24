import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { descriptAuth } from '../../';
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
    job_state: string;
    created_at: string;
    stopped_at?: string;
    drive_id: string;
    project_id?: string;
    project_url?: string;
    result?: JobResult;
    progress?: { label?: string; last_update_at?: string };
};

export const descriptGetJobStatusAction = createAction({
    auth: descriptAuth,
    name: 'get_job_status',
    displayName: 'Get Job Status',
    description:
        'Retrieves the current status of a Descript background job (import, agent edit, or publish). Use the job_id returned by any job-creation action.',
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

        const job = response.body;
        const result = job.result ?? {};

        return {
            job_id: job.job_id,
            job_type: job.job_type,
            job_state: job.job_state,
            created_at: job.created_at,
            stopped_at: job.stopped_at ?? null,
            drive_id: job.drive_id,
            project_id: job.project_id ?? null,
            project_url: job.project_url ?? null,
            result_status: result.status ?? null,
            result_agent_response: result.agent_response ?? null,
            result_project_changed: result.project_changed ?? null,
            result_media_seconds_used: result.media_seconds_used ?? null,
            result_ai_credits_used: result.ai_credits_used ?? null,
            result_share_url: result.share_url ?? null,
            result_download_url: result.download_url ?? null,
            result_download_url_expires_at: result.download_url_expires_at ?? null,
            result_error_message: result.error_message ?? null,
            progress_label: job.progress?.label ?? null,
        };
    },
});
