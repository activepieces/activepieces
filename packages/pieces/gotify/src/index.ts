
import { createPiece } from "@activepieces/pieces-framework";
import { sendNotification } from './lib/actions/send-notification';

export const gotify = createPiece({
  displayName: "Gotify",
  logoUrl: "https://cdn.activepieces.com/pieces/gotify.png",
  minimumSupportedRelease: "0.0.1",
  authors: ["MyWay"],
  actions: [sendNotification],
  triggers: [],
});