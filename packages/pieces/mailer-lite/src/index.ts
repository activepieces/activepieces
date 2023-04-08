
import { createPiece } from "@activepieces/pieces-framework";
import { createOrUpdateSubscriber } from "./lib/actions/create-or-update-subscription";
import packageJson from "../package.json";

export const mailerLite = createPiece({
  name: "mailer-lite",
  displayName: "MailerLite",
  logoUrl: "https://cdn.activepieces.com/pieces/mailer-lite.png",
  version: packageJson.version,
  authors: ["Willianwg"],
  actions: [createOrUpdateSubscriber],
  triggers: [],
});
