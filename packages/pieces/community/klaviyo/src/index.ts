
import { createPiece, PieceAuth } from "@activepieces/pieces-framework";

import { klaviyoAuth } from "./lib/common/auth";
import { createProfile } from "./lib/actions/create-profile";
import { updateProfile } from "./lib/actions/update-profile";

export const klaviyo = createPiece({
  displayName: "Klaviyo",
  auth: klaviyoAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: "https://cdn.activepieces.com/pieces/klaviyo.png",
  authors: ['Sanket6652'],
  actions: [createProfile, updateProfile],
  triggers: [],
});
