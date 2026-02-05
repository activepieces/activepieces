
    import { createPiece, PieceAuth } from "@activepieces/pieces-framework";
import { PieceCategory } from "@activepieces/shared";
import { vidnozClient } from "./lib/common/auth";
import { generateVideoWithAvatar } from "./lib/actions/generate-video-with-avatar";
import { generateVideoWithTemplate } from "./lib/actions/generate-video-with-template";
import { newGeneratedVideo } from "./lib/triggers/new-generated-video";

export const vidnozAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: 'Enter your Vidnoz API Key. You can get this from your Vidnoz account under API Credentials.',
  required: true,
  validate: async ({ auth }) => {
    if (auth) {
      try {
        const isValid = await vidnozClient.testConnection(auth);
        if (isValid) {
          return {
            valid: true,
          };
        } else {
          return {
            valid: false,
            error: 'Invalid API Key or connection failed',
          };
        }
      } catch (error) {
        return {
          valid: false,
          error: 'Connection test failed: ' + (error as Error).message,
        };
      }
    }
    return {
      valid: false,
      error: 'API Key is required',
    };
  },
});

export const vidnoz = createPiece({
  displayName: "Vidnoz",
  description: "AI video generation platform",
  auth: vidnozAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: "https://cdn.activepieces.com/pieces/vidnoz.png",
  categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE],
  authors: ['onyedikaci-david'],
  actions: [generateVideoWithAvatar, generateVideoWithTemplate],
  triggers: [newGeneratedVideo],
});
