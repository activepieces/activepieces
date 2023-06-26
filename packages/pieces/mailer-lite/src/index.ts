
import { createPiece } from "@activepieces/pieces-framework";
import { createOrUpdateSubscriber } from "./lib/actions/create-or-update-subscription";

export const mailerLite = createPiece({
  displayName: "MailerLite",
  logoUrl: "https://cdn.activepieces.com/pieces/mailer-lite.png",
  authors: ["Willianwg"],
  actions: [createOrUpdateSubscriber],
  triggers: [],
});
