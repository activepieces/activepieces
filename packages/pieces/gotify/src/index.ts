
import { createPiece } from "@activepieces/pieces-framework";
import packageJson from "../package.json";
import { sendNotification } from './lib/actions/send-notification';

export const gotify = createPiece({
  name: "gotify",
  displayName: "Gotify",
  logoUrl: "https://cdn.activepieces.com/pieces/gotify.png",
  version: packageJson.version,
  minimumSupportedRelease: "0.0.1",
  authors: ["MyWay"],
  actions: [sendNotification],
  triggers: [],
});