import { createPiece, PieceAuth, Piece } from "@activepieces/pieces-framework";
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

export const closeCrmAuth = PieceAuth.BasicAuth({
  description: "API Key from Close CRM (found in Settings -> API Keys). Use the API key as the username and leave the password field empty.",
  required: true,
  username: {
    displayName: "API Key",
    description: "Your Close CRM API Key.",
  },
  password: {
    displayName: "Password (leave empty)",
    description: "Leave this field empty.",
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
