import { createPiece, PieceAuth } from "@activepieces/pieces-framework";
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createContact } from "./lib/actions/create-contact";
import { createLead } from "./lib/actions/create-lead";
import { createDeal } from "./lib/actions/create-deal";
import { updateContact } from "./lib/actions/update-contact";
import { updateDeal } from "./lib/actions/update-deal";
import { createNote } from "./lib/actions/create-note";
import { createTask } from "./lib/actions/create-task";
import { findDeal } from "./lib/actions/find-deal";
import { findContact } from "./lib/actions/find-contact";
import { findLead } from "./lib/actions/find-lead";
import { findCompany } from "./lib/actions/find-company";
import { findUser } from "./lib/actions/find-user";
import { newContact } from "./lib/triggers/new-contact";
import { newLead } from "./lib/triggers/new-lead";
import { newDeal } from "./lib/triggers/new-deal";
import { updatedContact } from "./lib/triggers/updated-contact";
import { updatedLead } from "./lib/triggers/updated-lead";
import { updatedDeal } from "./lib/triggers/updated-deal";
import { newNote } from "./lib/triggers/new-note";
import { dealEntersNewStage } from "./lib/triggers/deal-enters-new-stage";

export const zendeskSellAuth = PieceAuth.SecretText({
  displayName: 'Personal Access Token',
  description: 'Your Zendesk Sell Personal Access Token.',
  required: true,
});

export const zendeskSell = createPiece({
  displayName: "Zendesk Sell",
  description: "Sales automation platform that helps sales teams manage leads, contacts, deals, pipelines, and notes.",
  auth: zendeskSellAuth,
  minimumSupportedRelease: '0.5.0',
  logoUrl: "https://cdn.activepieces.com/pieces/zendesk.png",
  authors: ['kishanprmr', 'MoShizzle', 'khaledmashaly', 'abuaboud', 'aryel780', 'Shivrajsoni'],
  actions: [
    createContact,
    createLead,
    createDeal,
    updateContact,
    updateDeal,
    createNote,
    createTask,
    findDeal,
    findContact,
    findLead,
    findCompany,
    findUser,
    createCustomApiCallAction({
      baseUrl: () => 'https://api.getbase.com/v2',
      auth: zendeskSellAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${auth}`,
      }),
    }),
  ],
  triggers: [newContact, newLead, newDeal, updatedContact, updatedLead, updatedDeal, newNote, dealEntersNewStage],
});
