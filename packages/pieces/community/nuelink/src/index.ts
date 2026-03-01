
import { createPiece, PieceAuth } from "@activepieces/pieces-framework";
import { createPost } from "./lib/actions/create-post";
import { PieceCategory } from "@activepieces/shared";

export const nuelinkAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  required: true,
  description: 'Please use **Nuelink API Key**.',
});

export const nuelink = createPiece({
  displayName: "Nuelink",
  auth: nuelinkAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: "https://cdn.activepieces.com/pieces/nuelink.png",
  categories:[PieceCategory.CONTENT_AND_FILES,PieceCategory.MARKETING],
  authors: ['AouladLahceneOussama'],
  actions: [createPost],
  triggers: [],
});
