import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { mistralAuth } from '../common/auth';
import { mistralApi } from '../common/client';
import { BATCH_ENDPOINT_OPTIONS, batchUtils, MistralBatchJob } from '../common/batch';
import { batchJobOutputSchema } from '../output-schemas';

export const createBatchJob = createAction({
	auth: mistralAuth,
	name: 'create_batch_job',
	classification: 'WRITE',
	displayName: 'Create Batch Job',
	description: 'Start a batch inference job over many requests.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Starts an asynchronous batch inference job that runs many requests against one endpoint and model at reduced cost, and returns the job id and initial status (not the results). Give either uploaded .jsonl input file ids (Upload File with purpose batch) or inline requests. Poll Get Batch Job until the status is SUCCESS, then fetch the output file with Download File. Not idempotent: each call starts and bills a new job.',
		idempotent: false,
	},
	outputSchema: batchJobOutputSchema,
	props: {
		endpoint: Property.StaticDropdown({
			displayName: 'Endpoint',
			required: true,
			defaultValue: '/v1/chat/completions',
			options: { options: BATCH_ENDPOINT_OPTIONS },
		}),
		model: Property.ShortText({
			displayName: 'Model',
			description: 'Model id to run every request with, e.g. mistral-small-latest.',
			required: false,
		}),
		input_files: Property.Array({
			displayName: 'Input File IDs',
			description: 'UUIDs of .jsonl files uploaded with purpose batch. Each line needs a custom_id and a body.',
			required: false,
		}),
		requests: Property.Json({
			displayName: 'Inline Requests',
			description: 'Instead of files, a JSON array of requests, each {"custom_id": "...", "body": {...}}.',
			required: false,
		}),
		metadata: Property.Json({
			displayName: 'Metadata',
			description: 'Optional JSON object stored with the job.',
			required: false,
		}),
		timeout_hours: Property.Number({
			displayName: 'Timeout (hours)',
			required: false,
			defaultValue: 24,
		}),
	},
	async run(context) {
		const { endpoint, model, input_files, requests, metadata, timeout_hours } = context.propsValue;
		const inputFiles = mistralApi.toStringArray(input_files);
		const inlineRequests = mistralApi.parseJsonInput({ value: requests, fieldName: 'Inline Requests' });
		if (inputFiles.length === 0 && (!Array.isArray(inlineRequests) || inlineRequests.length === 0)) {
			throw new Error('Provide Input File IDs or a non-empty Inline Requests array.');
		}
		const job = await mistralApi.call<MistralBatchJob>({
			auth: context.auth,
			method: HttpMethod.POST,
			path: '/batch/jobs',
			body: mistralApi.compact({
				endpoint,
				model,
				input_files: inputFiles.length > 0 ? inputFiles : undefined,
				requests: Array.isArray(inlineRequests) && inlineRequests.length > 0 ? inlineRequests : undefined,
				metadata: mistralApi.parseJsonInput({ value: metadata, fieldName: 'Metadata' }),
				timeout_hours,
			}),
		});
		return batchUtils.formatJob(job);
	},
});
