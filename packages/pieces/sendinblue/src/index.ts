
import { createPiece } from "@activepieces/pieces-framework";
import { createOrUpdateContact } from "./lib/actions/create-or-update-contact";

export const sendinblue = createPiece({
  displayName: "Sendinblue",
  logoUrl: "https://cdn.activepieces.com/pieces/sendinblue.png",
  authors: ['kanarelo'],
  actions: [createOrUpdateContact],
  triggers: [],
});
