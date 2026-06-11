import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { PieceAuth, createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';

// Actions
import { makeOutboundCall } from './lib/actions/make-outbound-call';
import { listCalls } from './lib/actions/list-calls';
import { getCallDetails } from './lib/actions/get-call-details';
import { getCallTranscript } from './lib/actions/get-call-transcript';
import { hangupCall } from './lib/actions/hangup-call';
import { createAgent } from './lib/actions/create-agent';
import { listAgents } from './lib/actions/list-agents';
import { getAgent } from './lib/actions/get-agent';
import { updateAgent } from './lib/actions/update-agent';
import { provisionNumber } from './lib/actions/provision-number';
import { listNumbers } from './lib/actions/list-numbers';
import { checkBalance } from './lib/actions/check-balance';
import { pollEvents } from './lib/actions/poll-events';

// Triggers
import { newCallCompleted } from './lib/triggers/new-call-completed';
import { newSmsReceived } from './lib/triggers/new-sms-received';
import { newInboundCall } from './lib/triggers/new-inbound-call';

export const agentlineAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  required: true,
  description:
    'Your Agentline API key (starts with `sk_live_`). Sign up at https://agentline.cloud to get one.',
});

export const agentline = createPiece({
  displayName: 'Agentline',
  description:
    'AI telephony — give your agents real phone numbers and voice calls. No servers, no webhooks, no infrastructure.',
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/agentline.png',
  auth: agentlineAuth,
  categories: [PieceCategory.COMMUNICATION],
  authors: ['Sameersribot'],
  actions: [
    makeOutboundCall,
    listCalls,
    getCallDetails,
    getCallTranscript,
    hangupCall,
    createAgent,
    listAgents,
    getAgent,
    updateAgent,
    provisionNumber,
    listNumbers,
    checkBalance,
    pollEvents,
    createCustomApiCallAction({
      baseUrl: () => 'https://api.agentline.cloud',
      auth: agentlineAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${(auth as { secret_text: string }).secret_text}`,
      }),
    }),
  ],
  triggers: [newCallCompleted, newSmsReceived, newInboundCall],
});
