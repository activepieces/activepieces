import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { resendAuth } from '../..';
import { resendClient } from '../common/client';
import { listTopicsOutputSchema } from '../output-schemas';

export const listTopics = createAction({
  name: 'list_topics',
  classification: 'SEARCH',
  auth: resendAuth,
  displayName: 'List Topics',
  outputSchema: listTopicsOutputSchema,
  description: 'Retrieve all topics in your Resend account',
  audience: 'ai',
  aiMetadata: { description: 'Retrieves every topic defined on the account, including each one\'s name, description, default subscription, and visibility. Use this to discover a topic ID or to check whether a suitable topic already exists. Read-only and idempotent.', idempotent: true },
  props: {},
  async run({ auth }) {
    const response = await resendClient.sendRequest<{
      data: {
        id: string;
        name: string;
        description: string;
        default_subscription: string;
        visibility: string;
        created_at: string;
      }[];
    }>({ auth: auth.secret_text, method: HttpMethod.GET, path: '/topics' });
    return response.data;
  },
});
