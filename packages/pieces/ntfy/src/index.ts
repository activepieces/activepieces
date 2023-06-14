
import { createPiece } from "@activepieces/pieces-framework";
import { sendNotification } from './lib/actions/send-notification';

export const gotify = createPiece({
  displayName: "Ntfy",
  logoUrl: "https://cdn.activepieces.com/pieces/ntfy.png",
  minimumSupportedRelease: "0.0.1",
  authors: ["MyWay"],
  actions: [sendNotification],
  triggers: [],
});