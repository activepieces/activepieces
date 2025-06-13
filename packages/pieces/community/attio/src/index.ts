
import { createPiece, PieceAuth } from "@activepieces/pieces-framework";
import { PieceCategory } from "@activepieces/shared";
import { createdListEntry } from "./lib/triggers/created-list-entry";
import { createdRecord } from "./lib/triggers/created-record";
import { updatedListEntry } from "./lib/triggers/updated-list-entry";
import { updatedRecord } from "./lib/triggers/updated-record";
import { createEntry } from "./lib/actions/create-entry";
import { createRecord } from "./lib/actions/create-record";
import { findListEntry } from "./lib/actions/find-list-entry";
import { findRecord } from "./lib/actions/find-record";
import { updateEntry } from "./lib/actions/update-entry";
import { updateRecord } from "./lib/actions/update-record";

export const attioAuth = PieceAuth.SecretText({
  displayName: 'API key',
  description:
    "To Use Attio, you need to generate an API Key. Here's a link on how to do that https://attio.com/help/apps/other-apps/generating-an-api-key",
  required: true,
});

export const attio = createPiece({
  displayName: "Attio",
  auth: attioAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: "https://cdn.activepieces.com/pieces/attio.png",
  authors: ['gs03dev'],
  actions: [
    createEntry,
    createRecord,
    findListEntry,
    findRecord,
    updateEntry,
    updateRecord
  ],
  triggers: [
    createdListEntry,
    createdRecord,
    updatedListEntry,
    updatedRecord
  ],
  categories: [PieceCategory.SALES_AND_CRM]
});
    