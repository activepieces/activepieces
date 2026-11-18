import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { bannerbearAuth } from '../auth';
import { bannerbearClient } from '../common/client';
import { bannerbearOutputSchemas } from '../output-schemas';

export const getAccountAction = createAction({
  auth: bannerbearAuth,
  name: 'get_account',
  classification: 'READ',
  displayName: 'Get Account',
  description: 'Get plan and credit usage for this API key.',
  audience: 'both',
  aiMetadata: {
    description:
      'Read the Bannerbear plan, credit quota and usage for the connected key. Use to check remaining credits before rendering. Read-only.',
    idempotent: true,
  },
  outputSchema: bannerbearOutputSchemas['account'],
  props: {},
  async run({ auth }) {
    const apiKey = auth.secret_text;
    const raw = await bannerbearClient.request<RawAccount>({
      apiKey,
      method: HttpMethod.GET,
      path: '/account',
    });
    if (bannerbearClient.getVersion(apiKey) === 'v5') {
      return {
        uid: raw.uid ?? null,
        api_version: 'v5',
        plan: raw.plan ?? null,
        project_name: raw.workspace ?? null,
        api_usage: raw.quota?.current ?? null,
        api_quota: raw.quota?.max ?? null,
        api_remaining: raw.quota?.remaining ?? null,
        created_at: raw.created_at ?? null,
      };
    }
    const usage = raw.api_usage ?? null;
    const quota = raw.api_quota ?? null;
    return {
      uid: raw.uid ?? null,
      api_version: 'v2',
      plan: raw.paid_plan_name ?? null,
      project_name: raw.current_project?.name ?? null,
      api_usage: usage,
      api_quota: quota,
      api_remaining: usage !== null && quota !== null ? quota - usage : null,
      created_at: raw.created_at ?? null,
    };
  },
});

type RawAccount = {
  uid?: string;
  created_at?: string;
  plan?: string;
  workspace?: string;
  quota?: { max?: number; current?: number; remaining?: number };
  paid_plan_name?: string;
  api_usage?: number;
  api_quota?: number;
  current_project?: { name?: string };
};
