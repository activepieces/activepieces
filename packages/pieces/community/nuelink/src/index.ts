
import { createPiece, PieceAuth } from "@activepieces/pieces-framework";
import { createPost } from "./lib/actions/create-post";

export const nuelinkAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  required: true,
  description: 'Please use **Nuelink API Key**',
});

export const nuelink = createPiece({
  displayName: "Nuelink",
  auth: nuelinkAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: "https://nuelink.com/img/logo.svg",
  authors: [],
  actions: [createPost],
  triggers: [],
});
