
import { createPiece } from "@activepieces/pieces-framework";
import { newContact } from "./lib/triggers/new-contact";

export const zohoCrm = createPiece({
  displayName: "Zoho CRM",
  logoUrl: "https://cdn.activepieces.com/pieces/zoho-crm.png",
  minimumSupportedRelease: "0.3.9",
  authors: [
    "abuaboud"
  ],
  actions: [],
  triggers: [newContact],
});
