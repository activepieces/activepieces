import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { mailflossAuth } from '../auth';
import { mailflossApi } from '../common/client';
import { jobIdProp } from '../common/props';

export const getBatchStatusAction = createAction({
  auth: mailflossAuth,
  name: 'get_batch_status',
  classification: 'READ',
  displayName: 'Get Batch Status',
  description: 'Check the progress of a batch verification job.',
  audience: 'both',
  aiMetadata: {
    description:
      'Reads the progress of a batch verification job started with Start Batch Verification: whether it has finished, how many addresses were imported and verified, and how many passed, failed, were undeliverable, risky or unknown. Safe to retry.',
    idempotent: true,
  },
  props: {
    jobId: jobIdProp,
  },
  async run(context) {
    return mailflossApi.send<Record<string, unknown>>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.GET,
      path: `/v1/batch-verify/${encodeURIComponent(
        context.propsValue.jobId.trim()
      )}/status`,
    });
  },
});
