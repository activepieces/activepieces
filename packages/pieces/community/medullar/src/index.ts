
import { createPiece, PieceAuth } from "@activepieces/pieces-framework";
import { createSpace } from "./lib/actions/create-space";
import { listSpaces } from "./lib/actions/list-spaces";
import { addSpaceRecord } from "./lib/actions/add-space-record";

export const medullarAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  required: true,
  description: 'Please use **api-key** as value for API Key',
});

export const medullar = createPiece({
  displayName: "Medullar",
  auth: medullarAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: "https://cdn.medullar.com/images/web/logo/medullar_favicon_128x128.png",
  authors: [],
  actions: [createSpace, listSpaces, addSpaceRecord],
  triggers: [],
});
    