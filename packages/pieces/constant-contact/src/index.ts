
import { createPiece } from "@activepieces/pieces-framework";
import { createOrUpdateContact } from "./lib/actions/create-or-update-contact";

export const constantContact = createPiece({
  displayName: "Constant Contact",
  logoUrl: "https://cdn.activepieces.com/pieces/constant-contact.png",
  authors: ["abuaboud"],
  actions: [createOrUpdateContact],
  triggers: [],
});
