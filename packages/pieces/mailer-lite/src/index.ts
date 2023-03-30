
import { createPiece } from "@activepieces/framework";
import { createOrUpdateSubscriber } from "./lib/actions/create-or-update-subscription";
import packageJson from "../package.json";

export const mailerLite = createPiece({
  name: "mailer-lite",
  displayName: "MailerLite",
  logoUrl: "https://th.bing.com/th/id/OIP.0maQAaoUZ0QxEAxyoBkhAQHaHa?pid=ImgDet&rs=1",
  version: packageJson.version,
  authors: ["Willianwg"],
  actions: [createOrUpdateSubscriber],
  triggers: [],
});
