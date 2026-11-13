import { createAction } from '@activepieces/pieces-framework';
import { filetopdfAuth } from '../auth';
import { filetopdfApi } from '../common/api';
import { getAccountOutputSchema } from '../output-schemas';

export const getAccountAction = createAction({
  auth: filetopdfAuth,
  name: 'get_account',
  outputSchema: getAccountOutputSchema,
  classification: 'READ',
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
    const data = await filetopdfApi.getAccount({ auth: context.auth });
    return {
      workspaceId: data?.workspace_id,
      plan: data?.plan,
      creditsRemaining: data?.credits_remaining,
      subscriptionStatus: data?.subscription_status,
    };
  },
});
