import { createPiece, PieceAuth } from "@activepieces/pieces-framework";
import { PieceCategory } from '@activepieces/shared';
import { addRecipientsAction } from "./lib/actions/add-recipients";
import { countEmailsAction } from "./lib/actions/count-emails";
import { createLeadAction } from "./lib/actions/create-lead";
import { deleteLeadAction } from "./lib/actions/delete-lead";
import { findEmailAction } from "./lib/actions/find-email";
import { getLeadAction } from "./lib/actions/get-lead";
import { searchLeadsAction } from "./lib/actions/search-leads";
import { updateLeadAction } from "./lib/actions/update-lead";
import { verifyEmailAction } from "./lib/actions/verify-email";
import { newLeadTrigger } from "./lib/triggers/new-lead";

export const hunterAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  required: true,
  description: 'You can obtain your API key from [Account Settings](https://hunter.io/dashboard)',
});

export const hunter = createPiece({
  displayName: "Hunter",
  description: 'Find, verify and manage professional email addresses at scale. Automate email discovery, validation, lead tracking, and campaign outreach with Hunter.io.',
  auth: hunterAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: "https://cdn.activepieces.com/pieces/hunter.png",
  authors: ['varshith257'],
  categories: [PieceCategory.SALES_AND_CRM],
  actions: [
    addRecipientsAction,
    countEmailsAction,
    createLeadAction,
    deleteLeadAction,
    findEmailAction,
    getLeadAction,
    searchLeadsAction,
    updateLeadAction,
    verifyEmailAction,
  ],
  triggers: [newLeadTrigger],
});