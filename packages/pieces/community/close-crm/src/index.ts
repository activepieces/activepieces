import { createPiece, PieceAuth, Piece } from "@activepieces/pieces-framework";
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { CLOSE_API_URL } from './lib/common/constants';
import { findLead } from "./lib/actions/find-lead";
import { findContact } from "./lib/actions/find-contact";
import { findOpportunity } from "./lib/actions/find-opportunity";
import { createLead } from "./lib/actions/create-lead";
import { createContact } from "./lib/actions/create-contact";
import { createOpportunity } from "./lib/actions/create-opportunity";
import { sendEmail } from "./lib/actions/send-email";
import { newLeadCreated } from './lib/triggers/new-lead-trigger';
import { newContactAdded } from './lib/triggers/new-contact-trigger';
import { opportunityStatusChanged } from './lib/triggers/opportunity-status-changed-trigger';

export const closeCrmAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: 'Your Close CRM API Key (found in Settings -> API Keys).',
  required: true,
  validate: async ({ auth }) => {
    if (!auth) {
      return {
        valid: false,
        error: 'API Key cannot be empty.',
      };
    }
    try {
      await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `${CLOSE_API_URL}/me/`,
        headers: {
          'Authorization': 'Basic ' + Buffer.from(`${auth}:`).toString('base64'),
          'Accept': 'application/json',
        },
      });
      return { valid: true };
    } catch (e: any) {
        let error = 'Invalid API Key.';
        if (e.response?.status === 401) {
            error = 'API Key is invalid or does not have sufficient permissions.';
        }
      return {
        valid: false,
        error: error,
      };
    }
  },
});

export const closeCrm: Piece = createPiece({
  displayName: "Close CRM",
  auth: closeCrmAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: "https://cdn.activepieces.com/pieces/close-crm.png",
  authors: [],
  actions: [findLead, findContact, findOpportunity, createLead, createContact, createOpportunity, sendEmail],
  triggers: [newLeadCreated, newContactAdded, opportunityStatusChanged],
});
