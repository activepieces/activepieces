
import { createPiece } from "@activepieces/pieces-framework";
import packageJson from "../package.json";
import { sendNotification } from './lib/actions/send-notification';

export const pushover = createPiece({
  name: "pushover",
  displayName: "Pushover",
  logoUrl: "https://cdn.activepieces.com/pieces/pushover.png",
  version: packageJson.version,
  minimumSupportedRelease: "0.0.1",
  authors: ['MyWay'],
  actions: [sendNotification],
  triggers: [],
});
