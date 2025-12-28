import { createPiece, PieceAuth } from "@activepieces/pieces-framework";
import { AuthenticationType, httpClient, HttpMethod } from '@activepieces/pieces-common';
import { PieceCategory } from "@activepieces/shared";
import { freeAgentCreateTask } from './lib/actions/create-task';
import { freeAgentCreateContact } from './lib/actions/create-contact';
import { freeAgentNewInvoiceTrigger } from './lib/triggers/new-invoice';
import { freeAgentNewContactTrigger } from './lib/triggers/new-contact';
import { freeAgentNewUserTrigger } from './lib/triggers/new-user';
import { freeAgentNewTaskTrigger } from './lib/triggers/new-task';

export const freeAgentAuth = PieceAuth.OAuth2({
  description: 'Connect your FreeAgent account',
  authUrl: 'https://api.freeagent.com/v2/approve_app',
  tokenUrl: 'https://api.freeagent.com/v2/token_endpoint',
  required: true,
  scope: [],
  validate: async (auth) => {
    try {
      await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: 'https://api.freeagent.com/v2/users/me',
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: auth.auth.access_token,
        },
      });
      return {
        valid: true,
      };
    } catch (e) {
      return {
        valid: false,
        error: 'Authentication failed. Please check your credentials.',
      };
    }
  },
});

export const freeAgent = createPiece({
  displayName: "FreeAgent",
  description: "Accounting and invoicing software for small businesses",
  auth: freeAgentAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: "https://cdn.activepieces.com/pieces/free-agent.png",
  authors: ['onyedikachi-david'],
  categories: [PieceCategory.ACCOUNTING],
  actions: [freeAgentCreateTask, freeAgentCreateContact],
  triggers: [freeAgentNewInvoiceTrigger, freeAgentNewContactTrigger, freeAgentNewUserTrigger, freeAgentNewTaskTrigger],
});
