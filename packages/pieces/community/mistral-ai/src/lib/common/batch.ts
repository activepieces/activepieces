import { Property } from '@activepieces/pieces-framework';
import { fileUtils } from './files';

function formatJob(job: MistralBatchJob) {
	return {
		id: job.id,
		status: job.status,
		endpoint: job.endpoint,
		model: job.model ?? null,
		agent_id: job.agent_id ?? null,
		input_files: job.input_files ?? [],
		output_file: job.output_file ?? null,
		error_file: job.error_file ?? null,
		total_requests: job.total_requests,
		completed_requests: job.completed_requests,
		succeeded_requests: job.succeeded_requests,
		failed_requests: job.failed_requests,
		errors: (job.errors ?? []).map((error) => ({ message: error.message, count: error.count ?? null })),
		metadata: job.metadata ?? null,
		outputs: job.outputs ?? null,
		created_at: fileUtils.toIso(job.created_at),
		started_at: fileUtils.toIso(job.started_at),
		completed_at: fileUtils.toIso(job.completed_at),
	};
}

function jobIdProp() {
	return Property.ShortText({
		displayName: 'Batch Job ID',
		description: 'The batch job UUID, from Create Batch Job or List Batch Jobs.',
		required: true,
	});
}

export const batchUtils = { formatJob, jobIdProp };

export const BATCH_STATUS_OPTIONS = [
	{ label: 'Queued', value: 'QUEUED' },
	{ label: 'Running', value: 'RUNNING' },
	{ label: 'Success', value: 'SUCCESS' },
	{ label: 'Failed', value: 'FAILED' },
	{ label: 'Timeout Exceeded', value: 'TIMEOUT_EXCEEDED' },
	{ label: 'Cancellation Requested', value: 'CANCELLATION_REQUESTED' },
	{ label: 'Cancelled', value: 'CANCELLED' },
];

export const BATCH_ENDPOINT_OPTIONS = [
	{ label: 'Chat Completions', value: '/v1/chat/completions' },
	{ label: 'Embeddings', value: '/v1/embeddings' },
	{ label: 'FIM Completions', value: '/v1/fim/completions' },
	{ label: 'Moderations', value: '/v1/moderations' },
	{ label: 'Chat Moderations', value: '/v1/chat/moderations' },
	{ label: 'OCR', value: '/v1/ocr' },
	{ label: 'Classifications', value: '/v1/classifications' },
	{ label: 'Chat Classifications', value: '/v1/chat/classifications' },
	{ label: 'Conversations', value: '/v1/conversations' },
	{ label: 'Audio Transcriptions', value: '/v1/audio/transcriptions' },
];

export type MistralBatchJob = {
	id: string;
	status: string;
	endpoint: string;
	model?: string | null;
	agent_id?: string | null;
	input_files?: string[];
	output_file?: string | null;
	error_file?: string | null;
	errors?: { message: string; count?: number }[];
	outputs?: Record<string, unknown>[] | null;
	metadata?: Record<string, unknown> | null;
	total_requests: number;
	completed_requests: number;
	succeeded_requests: number;
	failed_requests: number;
	created_at: number;
	started_at?: number | null;
	completed_at?: number | null;
};
