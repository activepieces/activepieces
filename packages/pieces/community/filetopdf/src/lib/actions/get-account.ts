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
