import { createPiece, PieceAuth } from "@activepieces/pieces-framework";
import { PieceCategory } from '@activepieces/shared';
import { makePhoneCall } from "./lib/actions/make-phone-call";
import { phoneCallEnded } from "./lib/triggers/phone-call-ended";
import { addLead } from "./lib/actions/add-lead";
import { sendSms } from "./lib/actions/send-sms";
import { inboundCall } from "./lib/triggers/inbound-call";
import { getAssistants } from "./lib/triggers/get-assistants";
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { baseApiUrl } from './lib/common';
import { campaignControl } from "./lib/actions/campaign-control";
import { deleteLead } from "./lib/actions/delete-lead";


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
  actions: [addLead,sendSms,campaignControl,makePhoneCall,deleteLead],
  triggers: [phoneCallEnded,getAssistants,inboundCall],
});
    