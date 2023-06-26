
import { createPiece } from "@activepieces/pieces-framework";
import { sendNotification } from './lib/actions/send-notification';

export const pushover = createPiece({
  displayName: "Pushover",
  logoUrl: "https://cdn.activepieces.com/pieces/pushover.png",
  minimumSupportedRelease: "0.0.1",
  authors: ['MyWay'],
  actions: [sendNotification],
  triggers: [],
});
