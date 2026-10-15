import { HttpMethod } from '@activepieces/pieces-common';

import { emeliaClient } from './client';

async function runJob({ apiKey, path, body, maxWaitMs }: RunJobParams): Promise<EnrichmentJobResult> {
	const started = await emeliaClient.request<{ jobId?: string }>({
		apiKey,
		method: HttpMethod.POST,
		path,
		body,
	});
	if (!started.jobId) {
		throw new Error('Emelia did not return a job id for this search.');
	}
	const jobId = started.jobId;
	const deadline = Date.now() + maxWaitMs;
	while (Date.now() < deadline) {
		await emeliaClient.sleep({ ms: POLL_INTERVAL_MS });
		const job = await getJob({ apiKey, path, jobId });
		if (job.status !== 'running') {
			return { jobId, job, timedOut: false };
		}
	}
	return { jobId, job: await getJob({ apiKey, path, jobId }), timedOut: true };
}

async function getJob({ apiKey, path, jobId }: { apiKey: string; path: string; jobId: string }): Promise<EnrichmentJob> {
	const response = await emeliaClient.request<{ data?: EnrichmentJob }>({
		apiKey,
		method: HttpMethod.GET,
		path: `${path}/${encodeURIComponent(jobId)}`,
	});
	return response.data ?? { status: 'running' };
}

const POLL_INTERVAL_MS = 4_000;

export const emeliaEnrichment = {
	runJob,
};

export type EnrichmentJob = Record<string, unknown> & {
	status?: string;
};

export type EnrichmentJobResult = {
	jobId: string;
	job: EnrichmentJob;
	timedOut: boolean;
};

type RunJobParams = {
	apiKey: string;
	path: string;
	body: Record<string, string>;
	maxWaitMs: number;
};
