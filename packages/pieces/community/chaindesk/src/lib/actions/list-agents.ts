import { createAction } from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';
import { chaindeskAuth } from '../common/auth';
import { BASE_URL } from '../common/constants';
import { chaindeskOutputSchemas } from '../common/output-schemas';
import { withSafeError } from '../common/errors';
import { ChaindeskNamedEntity } from '../common/types';

export const listAgentsAction = createAction({
  auth: chaindeskAuth,
  name: 'list-agents',
  displayName: 'List Agents',
  description: 'Lists the agents in your account.',
  classification: 'SEARCH',
  audience: 'both',
  aiMetadata: {
    description:
      'Lists every Chaindesk (Askli) agent in the account with its ID, name and description. Use to find the agent ID needed by Query Agent or List Conversations. Read-only and idempotent.',
    idempotent: true,
  },
  props: {},
  outputSchema: chaindeskOutputSchemas.listAgents,
  async run(context) {
    const response = await withSafeError(() =>
      httpClient.sendRequest<ChaindeskNamedEntity[]>({
        method: HttpMethod.GET,
        url: BASE_URL + '/agents',
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: context.auth.secret_text,
        },
      })
    );
    if (!Array.isArray(response.body)) {
      throw new Error(
        'Chaindesk returned an unexpected agents response (expected a list).'
      );
    }
    const agents = response.body;
    return { agents, count: agents.length };
  },
});
