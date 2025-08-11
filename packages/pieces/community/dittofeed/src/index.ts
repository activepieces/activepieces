
import { createPiece, PieceAuth } from "@activepieces/pieces-framework";

import { identifyAction } from './lib/actions/identify';
import { trackAction } from './lib/actions/track';
import { screenAction } from './lib/actions/screen';

export const dittofeedAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  required: true,
  description: 'Please use **test-key** as value for API Key',
});

export const dittofeed = createPiece({
  displayName: "Dittofeed",
  auth: dittofeedAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: "https://cdn.activepieces.com/pieces/dittofeed.png",
  authors: [],
  actions: [identifyAction, trackAction, screenAction],
  triggers: [],
});
    