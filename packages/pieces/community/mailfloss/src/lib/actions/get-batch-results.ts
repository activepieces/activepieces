import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { mailflossAuth } from '../auth';
import { mailflossApi } from '../common/client';
import { jobIdProp } from '../common/props';

export const getBatchResultsAction = createAction({
  auth: mailflossAuth,
  name: 'get_batch_results',
  classification: 'READ',
  displayName: 'Get Batch Results',
  description: 'Get the verified addresses of a finished batch job.',
  audience: 'both',
  aiMetadata: {
    description:
      'Returns every verified address of a finished batch verification job, one row per address with its status, reason and suggested typo fix. Check Get Batch Status first to see whether the job has finished. Safe to retry.',
    idempotent: true,
  },
  props: {
    jobId: jobIdProp,
  },
  async run(context) {
    const path = `/v1/batch-verify/${encodeURIComponent(
      context.propsValue.jobId.trim()
    )}/results`;
    const results: Record<string, unknown>[] = [];
    let next: string | undefined;
    let previous: string | undefined;
    do {
      const page = await mailflossApi.send<ResultsPage>({
        apiKey: context.auth.secret_text,
        method: HttpMethod.GET,
        path,
        queryParams: { per_page: '1000', ...(next ? { next } : {}) },
      });
      results.push(...page.data);
      previous = next;
      next = page.next;
    } while (next && next !== previous);
    return results;
  },
});

type ResultsPage = {
  data: Record<string, unknown>[];
  next?: string;
};
