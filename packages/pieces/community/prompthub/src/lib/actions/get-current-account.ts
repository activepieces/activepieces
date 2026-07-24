import { createAction } from '@activepieces/pieces-framework';
import { PromptHubClient } from '../common/client';
import { prompthubAuth } from '../..';

export const getCurrentAccount = createAction({
  name: 'get_current_account',
  displayName: 'Get Current Account',
  description: 'Get the authenticated PromptHub account associated with the API token, including its current team context.',
  audience: 'ai',
  aiMetadata: { description: 'Get the PromptHub account authenticated by the current API token, including its current team context. Use this first when you do not already have a team ID: it yields the `current_team_id` that List Team Projects requires, making it the head of the resolution chain (account -> team -> projects -> head/run). Read-only.', idempotent: true },
  props: {},
  auth: prompthubAuth,
  async run({ auth }) {
    const client = new PromptHubClient(auth.secret_text);
    const result = await client.getMe();
    return result?.data ?? result;
  },
});
