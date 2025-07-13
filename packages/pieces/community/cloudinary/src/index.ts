
import { createPiece, PieceAuth } from "@activepieces/pieces-framework";
import { cloudinaryAuth } from "./lib/common/auth";

export const cloudinary = createPiece({
  displayName: "Cloudinary",
  auth: cloudinaryAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: "https://cdn.activepieces.com/pieces/cloudinary.png",
  authors: ['Sanket6652'],
  actions: [],
  triggers: [],
});
