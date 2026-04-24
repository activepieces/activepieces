import {
    createTrigger,
    TriggerStrategy,
    Property,
    AppConnectionValueForAuthProperty,
} from '@activepieces/pieces-framework';
import {
    DedupeStrategy,
    Polling,
    pollingHelper,
    HttpMethod,
} from '@activepieces/pieces-common';
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

type JobItem = {
    job_id: string;
    job_type: string;
    job_state: string;
    created_at: string;
    stopped_at?: string;
    drive_id: string;
    project_id?: string;
    project_url?: string;
    result?: JobResult;
};

type TriggerProps = {
    job_type_filter: string | undefined;
};

const TERMINAL_JOB_STATES = new Set([
    'stopped',
    'completed',
    'complete',
    'succeeded',
    'failed',
    'failure',
    'errored',
    'error',
    'cancelled',
    'canceled',
]);

const TERMINAL_RESULT_STATUSES = new Set([
    'success',
    'succeeded',
    'failed',
    'failure',
    'error',
    'cancelled',
    'canceled',
]);

function normalizeState(value: string | undefined): string {
    return value?.trim().toLowerCase() ?? '';
}

function isCompletedJob(job: JobItem): boolean {
    const state = normalizeState(job.job_state);
    if (TERMINAL_JOB_STATES.has(state)) {
        return true;
    }

    const resultStatus = normalizeState(job.result?.status);
    return TERMINAL_RESULT_STATUSES.has(resultStatus);
}

const SAMPLE_DATA = {
    job_id: 'project-agent-edit-e2f89ce6',
    job_type: 'agent',
    job_state: 'stopped',
    created_at: '2026-02-09T05:42:27.554Z',
    stopped_at: '2026-02-09T05:43:15.296Z',
    drive_id: '1df135a5-dc4a-4dc3-8f7d-681cfbe961e4',
    project_id: 'e2f89ce6',
    project_url: 'https://web.descript.com/e2f89ce6',
    result_status: 'success',
    result_agent_response:
        "Done! I've applied Studio Sound and added captions to your video.",
    result_project_changed: true,
    result_media_seconds_used: 0,
    result_ai_credits_used: 32,
    result_share_url: null,
    result_download_url: null,
    result_download_url_expires_at: null,
    result_error_message: null,
};

const polling: Polling<
    AppConnectionValueForAuthProperty<typeof descriptAuth>,
    TriggerProps
> = {
    strategy: DedupeStrategy.TIMEBASED,
    items: async ({ auth, propsValue }) => {
        const { job_type_filter } = propsValue;
        const params: Record<string, string> = { limit: '100' };
        if (job_type_filter && job_type_filter !== 'all') {
            params['type'] = job_type_filter;
        }

        const response = await descriptCommon.descriptApiCall<{
            data: JobItem[];
            pagination: { next_cursor?: string };
        }>({
            apiKey: descriptCommon.getAuthToken(auth),
            method: HttpMethod.GET,
            path: '/jobs',
            queryParams: params,
        });

        // Descript may use different terminal state labels across job types.
        const stoppedJobs = response.body.data.filter(isCompletedJob);

        return stoppedJobs.map((job) => {
            const result = job.result ?? {};
            return {
                epochMilliSeconds: new Date(job.stopped_at ?? job.created_at).getTime(),
                data: {
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
                },
            };
        });
    },
};

export const descriptJobCompletedTrigger = createTrigger({
    auth: descriptAuth,
    name: 'job_completed',
    displayName: 'Job Completed',
    description: 'Triggers when a Descript background job (import, agent edit, or publish) finishes.',
    props: {
        job_type_filter: Property.StaticDropdown({
            displayName: 'Job Type Filter',
            description: 'Only trigger for jobs of this type. Select "All job types" to trigger for any completed job.',
            required: false,
            defaultValue: 'all',
            options: {
                options: [
                    { label: 'All job types', value: 'all' },
                    { label: 'Import media', value: 'import/project_media' },
                    { label: 'Agent edit (Underlord)', value: 'agent' },
                    { label: 'Publish', value: 'publish' },
                ],
            },
        }),
    },
    sampleData: SAMPLE_DATA,
    type: TriggerStrategy.POLLING,
    async test() {
        return [SAMPLE_DATA];
    },
    async onEnable(context) {
        await pollingHelper.onEnable(polling, context);
    },
    async onDisable(context) {
        await pollingHelper.onDisable(polling, context);
    },
    async run(context) {
        return await pollingHelper.poll(polling, context);
    },
});
