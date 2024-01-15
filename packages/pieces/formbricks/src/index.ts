
import { createPiece, PieceAuth } from "@activepieces/pieces-framework";

export const formbricks = createPiece({
  displayName: "Formbricks",
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.9.0',
  logoUrl: "https://images.saasworthy.com/tr:w-160,h-0,c-at_max,q-95,e-sharpen-1/formbricks_42422_logo_1677563947_j3svn.jpg", //TODO: Fetch logo
  authors: [],
  actions: [],
  triggers: [],
});
