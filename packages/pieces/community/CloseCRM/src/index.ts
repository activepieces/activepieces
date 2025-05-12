import { createPiece, PieceAuth, Property } from "@activepieces/pieces-framework";
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { createLead } from "./lib/actions/create-lead";
import { logEmail } from "./lib/actions/log-email";
import { findLead } from "./lib/actions/find-lead";
import { newLeadAdded } from "./lib/triggers/new-lead-added";
import { createOpportunity } from "./lib/actions/create-opportunity";
import { findOpportunity } from "./lib/actions/find-opportunity";
import {opportunityStatusChanged} from "./lib/triggers/opportunity-status-changed";
import { createContact } from "./lib/actions/create-contact";
import { newContactAdded } from "./lib/triggers/new-contact-added";
import {findContact} from "./lib/actions/find-contact";

const CLOSE_API_URL = 'https://api.close.com/api/v1';
const CLOSE_API_URL_SANDBOX = 'https://api-sandbox.close.com/api/v1';

export const closeAuth = PieceAuth.CustomAuth({
  required: true,
  props: {
    apiKey: PieceAuth.SecretText({
      displayName: 'API Key',
      description: 'Your Close CRM API key for authentication',
      required: true,
    }),
    environment: Property.StaticDropdown({
      displayName: 'Environment',
      required: true,
      options: {
        options: [
          { label: 'Production', value: 'production' },
          { label: 'Sandbox', value: 'sandbox' },
        ],
      },
    }),
  },
  validate: async ({ auth }) => {
    try {
      await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `${auth.environment === 'sandbox' ? CLOSE_API_URL_SANDBOX : CLOSE_API_URL}/me/`,
        headers: {
          'Authorization': `Basic ${Buffer.from(`${auth.apiKey}:`).toString('base64')}`,
          'Accept': 'application/json',
        },
      });
      return { valid: true };
    } catch (e: any) {
      return {
        valid: false,
        error: e.response
          ? 'Invalid API key or insufficient permissions' 
          : 'Connection failed. Please check your API key and network connection',
      };
    }
  },
});

export const CloseCRM = createPiece({
  displayName: "CloseCRM",
  description: "Sales automation and CRM integration for Close",
  auth: closeAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: "https://cdn.activepieces.com/pieces/close-crm.png",
  authors: ['Ani-4x'], 
  actions: [
    createLead,
    createContact,
    logEmail,
    findLead,
    findOpportunity,
    createOpportunity,
    findContact,
  ],
  triggers: [
    newLeadAdded,
    newContactAdded,
    opportunityStatusChanged
  ],
});