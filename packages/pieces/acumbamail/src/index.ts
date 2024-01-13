
import { createPiece, PieceAuth } from "@activepieces/pieces-framework";
// import { acumbamailCommon } from "../common";
import { sendEmail } from "./lib/actions/send-email";

export const acumbamailAuth = PieceAuth.SecretText({
  displayName: "API key",
  description: "Your API key",
  required: true
})

export const acumbamail = createPiece({
  displayName: "Acumbamail",
  description:"Acumbamail",
  minimumSupportedRelease: '0.9.0',
  logoUrl: "https://attorneychiro.s3.amazonaws.com/activepieces/pieces/acumbamail.png",
  authors: ['Aced Empire'],
  auth: acumbamailAuth,
  actions: [sendEmail],
  triggers: [],
});

