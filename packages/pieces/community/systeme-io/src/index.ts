import { createPiece } from "@activepieces/pieces-framework";
import { systemeIoAuth } from "./lib/common/auth"

import { newContact } from "./lib/triggers/new-contact";
import { newSale } from "./lib/triggers/new-sale";
import { newTagAddedToContact } from "./lib/triggers/new-tag-added-to-contact"

import { createContact } from "./lib/actions/create-contact";
import { addTagToContact } from "./lib/actions/add-tag-to-contact";
import { removeTagFromContact } from "./lib/actions/remove-tag-from-contact";
import { findContactByEmail } from "./lib/actions/find-contact-by-email";
import { updateContact } from "./lib/actions/update-contact"
import { PieceCategory } from "@activepieces/shared";

export const systemeIo = createPiece({
  displayName: "Systeme.io",
  auth: systemeIoAuth,
  minimumSupportedRelease: '0.36.1',
  categories: [PieceCategory.MARKETING],
  description: "Systeme.io is a CRM platform that allows you to manage your contacts, sales, and marketing campaigns.",
  logoUrl: "https://cdn.activepieces.com/pieces/systeme-io.png",
  authors: ['ezhil56x', 'onyedikachi-david'],
  actions: [
    createContact,
    addTagToContact,
    removeTagFromContact,
    findContactByEmail,
    updateContact,
  ],
  triggers: [
    newContact,
    newSale,
    newTagAddedToContact,
  ],
});
