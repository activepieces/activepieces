import { createPiece, PieceAuth } from "@activepieces/pieces-framework";
import { PieceCategory } from '@activepieces/shared';
import { makePhoneCall } from "./lib/actions/make-phone-call";
import { phoneCallEnded } from "./lib/triggers/phone-call-ended";
import { conversationEnded } from "./lib/triggers/conversation-ended";
import { addLead } from "./lib/actions/add-lead";
import { sendSms } from "./lib/actions/send-sms";
import { inboundCall } from "./lib/triggers/inbound-call";
import { getAssistants } from "./lib/triggers/get-assistants";
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { baseApiUrl } from './lib/common';
import { campaignControl } from "./lib/actions/campaign-control";
import { createCampaign } from "./lib/actions/create-campaign";
import { deleteLead } from "./lib/actions/delete-lead";
import { updateLead } from "./lib/actions/update-lead";
import { getCurrentUser } from "./lib/actions/get-current-user";
import { listLeads } from "./lib/actions/list-leads";
import { listPhoneNumbers } from "./lib/actions/list-phone-numbers";
import { searchAvailablePhoneNumbers } from "./lib/actions/search-available-phone-numbers";
import { purchasePhoneNumber } from "./lib/actions/purchase-phone-number";
import { generateAiReply } from "./lib/actions/generate-ai-reply";
import { createConversation } from "./lib/actions/create-conversation";
import { getConversation } from "./lib/actions/get-conversation";
import { sendMessage } from "./lib/actions/send-message";
import { listConversations } from "./lib/actions/list-conversations";
import { listCalls } from "./lib/actions/list-calls";
import { getCall } from "./lib/actions/get-call";
import { deleteCall } from "./lib/actions/delete-call";
import { getWhatsAppSenders } from "./lib/actions/get-whatsapp-senders";
import { getWhatsAppTemplates } from "./lib/actions/get-whatsapp-templates";
import { sendWhatsAppTemplate } from "./lib/actions/send-whatsapp-template";
import { sendWhatsAppFreeform } from "./lib/actions/send-whatsapp-freeform";
import { getWhatsAppSessionStatus } from "./lib/actions/get-whatsapp-session-status";


export const famulorAuth =  PieceAuth.SecretText({
    displayName: 'API Key',
    description: 'Create an API key in your Famulor account and paste the value here. Get API key here -> https://app.famulor.de.',
    required: true,
    validate: async ({ auth }) => {
      try {
        const response = await httpClient.sendRequest({
          method: HttpMethod.GET,
          url: baseApiUrl + 'api/user/me',
          headers: {
            'Authorization': `Bearer ${auth}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
        });

        if (response.status === 200) {
          return {
            valid: true,
          };
        } else {
          return {
            valid: false,
            error: 'Invalid API key or authentication failed'
          };
        }
      } catch (error) {
        return {
          valid: false,
          error: 'Failed to validate API key. Please check your API key and try again.'
        };
      }
    }
  })

export const famulor = createPiece({
  displayName: "Famulor AI - Voice Agent",
  auth:famulorAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: "https://cdn.activepieces.com/pieces/famulor.png",
  description: "AI-powered calling and SMS platform. Automate outbound campaigns, manage leads, and get real-time call analytics.",
  authors: ['bekservice', 'onyedikachi-david'],
  categories: [PieceCategory.SALES_AND_CRM],
  actions: [
    addLead,
    listLeads,
    listPhoneNumbers,
    searchAvailablePhoneNumbers,
    purchasePhoneNumber,
    sendSms,
    createCampaign,
    campaignControl,
    makePhoneCall,
    updateLead,
    deleteLead,
    getCurrentUser,
    generateAiReply,
    createConversation,
    getConversation,
    sendMessage,
    getWhatsAppSenders,
    getWhatsAppTemplates,
    sendWhatsAppTemplate,
    sendWhatsAppFreeform,
    getWhatsAppSessionStatus,
    listConversations,
    listCalls,
    getCall,
    deleteCall,
  ],
  triggers: [phoneCallEnded, conversationEnded, getAssistants, inboundCall],
});

