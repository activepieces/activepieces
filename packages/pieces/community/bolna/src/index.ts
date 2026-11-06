import { createPiece } from '@activepieces/pieces-framework';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { bolnaaiAuth } from './lib/common/auth';
import { BASE_URL } from './lib/common/client';
import { makePhoneCall } from './lib/actions/make-phone-call';
import { getCallExecution } from './lib/actions/get-call-execution';
import { stopCall } from './lib/actions/stop-call';
import { listAgents } from './lib/actions/list-agents';
import { getAgent } from './lib/actions/get-agent';
import { listAgentExecutions } from './lib/actions/list-agent-executions';
import { listPhoneNumbers } from './lib/actions/list-phone-numbers';
import { listBatches } from './lib/actions/list-batches';
import { getAccountInfo } from './lib/actions/get-account-info';
import { callCompletionReport } from './lib/triggers/call-completion-report';

export const bolna = createPiece({
  displayName: 'Bolna AI',
  auth: bolnaaiAuth,
  minimumSupportedRelease: '0.86.4',
  logoUrl: 'https://cdn.activepieces.com/pieces/bolna.png',
  authors: ['sanket-a11y'],
  actions: [
    makePhoneCall,
    getCallExecution,
    stopCall,
    listAgents,
    getAgent,
    listAgentExecutions,
    listPhoneNumbers,
    listBatches,
    getAccountInfo,
    createCustomApiCallAction({
      auth: bolnaaiAuth,
      baseUrl: () => BASE_URL,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${auth.secret_text}`,
      }),
    }),
  ],
  triggers: [callCompletionReport],
});
