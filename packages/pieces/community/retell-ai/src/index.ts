import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { createBatchCallAction } from './lib/actions/create-batch-call';
import { createPhoneNumber } from './lib/actions/create-phone-number';
import { getAgent } from './lib/actions/get-agent';
import { getCall } from './lib/actions/get-call';
import { getPhoneNumber } from './lib/actions/get-phone-number';
import { getVoice } from './lib/actions/get-voice';
import { makePhoneCall } from './lib/actions/make-phone-call';
import { addKnowledgeBaseSourcesAction } from './lib/actions/ai/add-knowledge-base-sources';
import { buyPhoneNumberAction } from './lib/actions/ai/buy-phone-number';
import { createChatAction } from './lib/actions/ai/create-chat';
import { createContactAction } from './lib/actions/ai/create-contact';
import { createKnowledgeBaseAction } from './lib/actions/ai/create-knowledge-base';
import { createPhoneCallAction } from './lib/actions/ai/create-phone-call';
import { createSmsChatAction } from './lib/actions/ai/create-sms-chat';
import { createWebCallAction } from './lib/actions/ai/create-web-call';
import { deleteAgentAction } from './lib/actions/ai/delete-agent';
import { deleteCallAction } from './lib/actions/ai/delete-call';
import { deleteKnowledgeBaseSourceAction } from './lib/actions/ai/delete-knowledge-base-source';
import { deleteKnowledgeBaseAction } from './lib/actions/ai/delete-knowledge-base';
import { deletePhoneNumberAction } from './lib/actions/ai/delete-phone-number';
import { endChatAction } from './lib/actions/ai/end-chat';
import { getAgentByIdAction } from './lib/actions/ai/get-agent-by-id';
import { getCallByIdAction } from './lib/actions/ai/get-call-by-id';
import { getChatAgentAction } from './lib/actions/ai/get-chat-agent';
import { getChatAction } from './lib/actions/ai/get-chat';
import { getConcurrencyAction } from './lib/actions/ai/get-concurrency';
import { getContactByPhoneAction } from './lib/actions/ai/get-contact-by-phone';
import { getKnowledgeBaseAction } from './lib/actions/ai/get-knowledge-base';
import { getRetellLlmAction } from './lib/actions/ai/get-retell-llm';
import { getVoiceByIdAction } from './lib/actions/ai/get-voice-by-id';
import { listAgentVersionsAction } from './lib/actions/ai/list-agent-versions';
import { listAgentsAction } from './lib/actions/ai/list-agents';
import { listCallsAction } from './lib/actions/ai/list-calls';
import { listChatAgentsAction } from './lib/actions/ai/list-chat-agents';
import { listChatsAction } from './lib/actions/ai/list-chats';
import { listContactsAction } from './lib/actions/ai/list-contacts';
import { listKnowledgeBasesAction } from './lib/actions/ai/list-knowledge-bases';
import { listPhoneNumbersAction } from './lib/actions/ai/list-phone-numbers';
import { listRetellLlmsAction } from './lib/actions/ai/list-retell-llms';
import { listVoicesAction } from './lib/actions/ai/list-voices';
import { publishAgentAction } from './lib/actions/ai/publish-agent';
import { sendChatMessageAction } from './lib/actions/ai/send-chat-message';
import { stopCallAction } from './lib/actions/ai/stop-call';
import { updateAgentAction } from './lib/actions/ai/update-agent';
import { updateCallMetadataAction } from './lib/actions/ai/update-call-metadata';
import { updateContactAction } from './lib/actions/ai/update-contact';
import { updatePhoneNumberAgentsAction } from './lib/actions/ai/update-phone-number-agents';
import { updateRetellLlmPromptAction } from './lib/actions/ai/update-retell-llm-prompt';
import { retellAiAuth } from './lib/common/auth';
import { RETELL_BASE_URL } from './lib/common/client';
import { callAnalyzedTrigger } from './lib/triggers/call-analyzed';
import { callEndedTrigger } from './lib/triggers/call-ended';
import { newCallTrigger } from './lib/triggers/new-call';

export const retellAi = createPiece({
  displayName: 'Retell AI',
  auth: retellAiAuth,
  minimumSupportedRelease: '0.88.2',
  logoUrl: 'https://cdn.activepieces.com/pieces/retell-ai.png',
  authors: ['aryel780'],
  categories: [PieceCategory.BUSINESS_INTELLIGENCE, PieceCategory.PRODUCTIVITY, PieceCategory.COMMUNICATION],
  actions: [
    makePhoneCall,
    createPhoneNumber,
    getCall,
    getPhoneNumber,
    getVoice,
    getAgent,
    createBatchCallAction,
    addKnowledgeBaseSourcesAction,
    buyPhoneNumberAction,
    createChatAction,
    createContactAction,
    createKnowledgeBaseAction,
    createPhoneCallAction,
    createSmsChatAction,
    createWebCallAction,
    deleteAgentAction,
    deleteCallAction,
    deleteKnowledgeBaseSourceAction,
    deleteKnowledgeBaseAction,
    deletePhoneNumberAction,
    endChatAction,
    getAgentByIdAction,
    getCallByIdAction,
    getChatAgentAction,
    getChatAction,
    getConcurrencyAction,
    getContactByPhoneAction,
    getKnowledgeBaseAction,
    getRetellLlmAction,
    getVoiceByIdAction,
    listAgentVersionsAction,
    listAgentsAction,
    listCallsAction,
    listChatAgentsAction,
    listChatsAction,
    listContactsAction,
    listKnowledgeBasesAction,
    listPhoneNumbersAction,
    listRetellLlmsAction,
    listVoicesAction,
    publishAgentAction,
    sendChatMessageAction,
    stopCallAction,
    updateAgentAction,
    updateCallMetadataAction,
    updateContactAction,
    updatePhoneNumberAgentsAction,
    updateRetellLlmPromptAction,
    createCustomApiCallAction({
      auth: retellAiAuth,
      baseUrl: () => RETELL_BASE_URL,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${auth.props.apiKey.trim()}`,
      }),
    }),
  ],
  triggers: [newCallTrigger, callEndedTrigger, callAnalyzedTrigger],
});
