import { HttpMethod } from '@activepieces/pieces-common';
import { RunContext } from '@activepieces/pieces-framework';
import { FlatJob, hermosoApi } from './client';

async function start({
  apiKey,
  brand,
  body,
  wait,
  timeoutMs,
  run,
  stepName,
}: {
  apiKey: string;
  brand: string | undefined;
  body: Record<string, unknown>;
  wait: boolean;
  timeoutMs: number;
  run: RunContext;
  stepName: string;
}): Promise<FlatJob> {
  const key = hermosoApi.idempotencyKey({
    runId: run.id,
    stepName,
    operation: 'generation',
    payload: { brand: brand ?? '', body },
  });
  const waitpoint = wait && run.canPause ? await run.createWaitpoint({ type: 'WEBHOOK' }) : undefined;
  const callbackUrl = waitpoint ? waitpoint.buildResumeUrl({ queryParams: {} }) : undefined;
  const response = await hermosoApi.send<unknown>({
    apiKey,
    brand,
    method: HttpMethod.POST,
    path: '/generations',
    body,
    headers: {
      'Idempotency-Key': key,
      ...(callbackUrl ? { 'X-Hermoso-Callback-Url': callbackUrl } : {}),
    },
  });
  const job = hermosoApi.isRecord(response.body) ? response.body : {};
  if (hermosoApi.isFinished(job)) {
    return finished(job);
  }
  const jobId = hermosoApi.text(job['id']);
  if (!jobId) {
    throw new Error('Hermoso did not return a render job.');
  }
  if (!wait) {
    return hermosoApi.flattenJob(job);
  }
  if (waitpoint && response.headers['hermoso-callback'] === 'registered') {
    run.waitForWaitpoint(waitpoint.id);
    return hermosoApi.flattenJob(job);
  }
  const polled = await hermosoApi.waitForJob({ apiKey, brand, jobId, timeoutMs });
  return hermosoApi.isFinished(polled) ? finished(polled) : hermosoApi.flattenJob(polled);
}

async function resume({
  apiKey,
  brand,
  payload,
}: {
  apiKey: string;
  brand: string | undefined;
  payload: unknown;
}): Promise<FlatJob> {
  const jobId = hermosoApi.isRecord(payload) ? hermosoApi.text(payload['id']) : '';
  if (!jobId) {
    throw new Error('Hermoso resumed this step without a job ID.');
  }
  const job = await hermosoApi.getJob({ apiKey, brand, jobId });
  return hermosoApi.isFinished(job) ? finished(job) : hermosoApi.flattenJob(job);
}

function finished(job: Record<string, unknown>): FlatJob {
  const flat = hermosoApi.flattenJob(job);
  if (flat.status === 'error') {
    throw new Error(
      `Hermoso could not finish this render${flat.job_id ? ` (job ${flat.job_id})` : ''}: ${flat.error_message ?? 'the render failed'}.`
    );
  }
  return flat;
}

export const hermosoRender = { start, resume };
