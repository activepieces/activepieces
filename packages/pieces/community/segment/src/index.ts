
import { createPiece, PieceAuth } from "@activepieces/pieces-framework";
import { identifyUser } from "./lib/actions/identify-user";

export const segmentAuth = PieceAuth.SecretText({
  displayName: 'Analytics Key',
  required: true,
  description: 'Copy and paste your analytics write key here',
});


export const segment = createPiece({
  displayName: "Segment",
  auth: segmentAuth,
  minimumSupportedRelease: '0.30.0',
  logoUrl: "https://cdn.activepieces.com/pieces/segment.png",
  authors: ['abuaboud'],
  actions: [identifyUser],
  triggers: [],
});
