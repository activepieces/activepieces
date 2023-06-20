
import { createPiece } from "@activepieces/pieces-framework";
import { sendEmail } from "./lib/actions/send-email";

export const resend = createPiece({
  displayName: "Resend",
  logoUrl: "https://cdn.activepieces.com/pieces/resend.png",
  authors: [],
  actions: [sendEmail],
  triggers: [],
});
