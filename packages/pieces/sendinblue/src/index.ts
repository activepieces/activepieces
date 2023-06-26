
import { PieceAuth, createPiece } from "@activepieces/pieces-framework";
import { createOrUpdateContact } from "./lib/actions/create-or-update-contact";

export const sendinblueAuth = PieceAuth.SecretText({
  displayName: "Project API key",
  description: "Your project API key",
  required: true
})

export const sendinblue = createPiece({
  displayName: "Sendinblue",
  logoUrl: "https://cdn.activepieces.com/pieces/sendinblue.png",
  authors: ['kanarelo'],
  auth: sendinblueAuth,
  actions: [createOrUpdateContact],
  triggers: [],
});
