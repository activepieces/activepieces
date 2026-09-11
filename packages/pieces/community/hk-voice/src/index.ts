import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { createCallFlowAction, listCallFlowsAction, updateCallFlowAction } from './lib/actions/call-flows';
import { getCallLogAction, getCallMediaAction } from './lib/actions/call-logs';
import { listCampaignsAction, startCampaignAction } from './lib/actions/campaigns';
import { cloneAgentAction, updateAgentAction } from './lib/actions/clone-agent';
import { createContactAction, searchContactAction } from './lib/actions/contacts';
import { listAgentsAction } from './lib/actions/list-agents';
import { listNumbersAction } from './lib/actions/list-numbers';
import { startOutboundCallAction } from './lib/actions/start-outbound-call';
import { hkVoiceAuth } from './lib/auth';
import { hkVoiceApi } from './lib/common/client';
import {
    anyCallEventTrigger,
    callAnalysisCompletedTrigger,
    callEndedTrigger,
    callFailedTrigger,
} from './lib/triggers/call-webhooks';

export const hkVoice = createPiece({
    displayName: 'HK Voice AI',
    description:
        'Voice AI for Activepieces: AI voice agents, outbound AI phone calls, call flows, and post-call analysis. Place personalized Voice AI calls (agent, script, from-number, prompt variables like guest name), manage contacts, catch call.analysis_completed webhooks, and fetch recordings for PDF, email, or CRM. Heykoala Voice / HK Voice AI.',
    auth: hkVoiceAuth,
    minimumSupportedRelease: '0.36.1',
    logoUrl: 'https://heykoala.ai/favicon.ico',
    authors: ['heykoala'],
    categories: [PieceCategory.COMMUNICATION, PieceCategory.ARTIFICIAL_INTELLIGENCE],
    actions: [
        startOutboundCallAction,
        createContactAction,
        searchContactAction,
        getCallLogAction,
        getCallMediaAction,
        cloneAgentAction,
        updateAgentAction,
        listAgentsAction,
        createCallFlowAction,
        updateCallFlowAction,
        listCallFlowsAction,
        startCampaignAction,
        listCampaignsAction,
        listNumbersAction,
        createCustomApiCallAction({
            auth: hkVoiceAuth,
            baseUrl: (auth) =>
                hkVoiceApi.normalizeBaseUrl({
                    baseUrl: hkVoiceApi.connectionFromAuth(auth).baseUrl,
                }),
            authMapping: async (auth) => {
                const connection = hkVoiceApi.connectionFromAuth(auth);
                return hkVoiceApi.authHeaders({
                    apiKey: connection.apiKey,
                });
            },
        }),
    ],
    triggers: [
        callAnalysisCompletedTrigger,
        callEndedTrigger,
        callFailedTrigger,
        anyCallEventTrigger,
    ],
});
