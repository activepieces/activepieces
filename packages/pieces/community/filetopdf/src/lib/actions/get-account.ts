import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { filetopdfAuth } from '../common/auth';
import { filetopdfApiCall } from '../common/client';

export const getAccount = createAction({
  auth: filetopdfAuth,
  name: 'get_account',
  displayName: 'Get Account Status',
  description:
    'Read the workspace plan, remaining credits, and subscription status. Free — never consumes credits.',
  audience: 'both',
  aiMetadata: {
    description:
      'Fetches the FileToPDF workspace account status: plan, remaining credits, and subscription status. Use this to check available credits before queuing conversion calls or to report quota. Read-only and free — never consumes credits; idempotent.',
    idempotent: true,
  },
  props: {},
  async run(context) {
    const envelope = await filetopdfApiCall<AccountEnvelope>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.GET,
      resourceUri: '/account',
    });
    const data = envelope.data;
    return {
      workspaceId: data?.workspace_id,
      plan: data?.plan,
      creditsRemaining: data?.credits_remaining,
      subscriptionStatus: data?.subscription_status,
    };
  },
});

interface AccountEnvelope {
  status: string;
  data?: {
    workspace_id: string;
    plan: string;
    credits_remaining: number;
    subscription_status: string;
  };
}
