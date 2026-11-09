import { HttpMethod } from '@activepieces/pieces-common';
import { snaprenderApi } from './client';

export const snaprenderBatch = {
    getStatus,
    waitUntilFinished,
    toOutput,
    isFinished,
};

async function getStatus({ apiKey, jobId }: { apiKey: string; jobId: string }): Promise<BatchJobResponse> {
    const id = jobId.trim();
    if (!JOB_ID_PATTERN.test(id)) {
        throw new Error('Job ID must be the jobId value returned by Batch Screenshots, for example 550e8400-e29b-41d4-a716-446655440000.');
    }
    const response = await snaprenderApi.request<BatchJobResponse>({
        apiKey,
        method: HttpMethod.GET,
        path: `/v1/screenshot/batch/${encodeURIComponent(id)}`,
        timeoutMs: 30_000,
    });
    return response.body;
}

async function waitUntilFinished({
    apiKey,
    job,
    maxWaitMs,
    pollIntervalMs = POLL_INTERVAL_MS,
}: {
    apiKey: string;
    job: BatchJobResponse;
    maxWaitMs: number;
    pollIntervalMs?: number;
}): Promise<BatchJobResponse> {
    const deadline = Date.now() + maxWaitMs;
    let current = job;
    while (!isFinished(current) && Date.now() + pollIntervalMs <= deadline) {
        await sleep(pollIntervalMs);
        current = await getStatusOrKeep({ apiKey, jobId: job.jobId, fallback: current });
    }
    return current;
}

async function getStatusOrKeep({ apiKey, jobId, fallback }: { apiKey: string; jobId: string; fallback: BatchJobResponse }): Promise<BatchJobResponse> {
    try {
        return await getStatus({ apiKey, jobId });
    } catch {
        return fallback;
    }
}

function isFinished(job: BatchJobResponse): boolean {
    return job.status === 'completed' || job.status === 'failed';
}

function toOutput(job: BatchJobResponse): BatchOutput {
    const items = (job.items ?? []).map((item) => ({
        url: item.url,
        status: item.status,
        download_url: item.downloadUrl ?? null,
        error: item.error ?? null,
    }));
    return {
        job_id: job.jobId,
        status: job.status,
        finished: isFinished(job),
        total: job.total,
        completed: job.completed,
        failed: job.failed,
        estimated_seconds: typeof job.estimatedSeconds === 'number' ? job.estimatedSeconds : null,
        created_at: job.createdAt ?? null,
        completed_at: job.completedAt ?? null,
        download_urls: items.flatMap((item) => (item.download_url === null ? [] : [item.download_url])),
        items,
    };
}

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

const POLL_INTERVAL_MS = 3000;
const JOB_ID_PATTERN = /^[A-Za-z0-9-]{8,64}$/;

export type BatchJobResponse = {
    jobId: string;
    status: string;
    total: number;
    completed: number;
    failed: number;
    estimatedSeconds?: number;
    items?: { url: string; status: string; downloadUrl?: string; error?: string }[];
    createdAt?: string;
    completedAt?: string;
};

export type BatchOutput = {
    job_id: string;
    status: string;
    finished: boolean;
    total: number;
    completed: number;
    failed: number;
    estimated_seconds: number | null;
    created_at: string | null;
    completed_at: string | null;
    download_urls: string[];
    items: { url: string; status: string; download_url: string | null; error: string | null }[];
};
