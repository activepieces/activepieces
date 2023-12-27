
import { PieceAuth, Property, createPiece } from "@activepieces/pieces-framework";
import { textToImage } from "./lib/actions/text-to-image";

export const stabilityAiAuth = PieceAuth.CustomAuth({
 description: `Please visit https://platform.stability.ai/docs/getting-started/authentication to get your API Key`,
  props: {
    api_key: Property.ShortText({
      displayName: 'API Key',
      required: true,
    }),
  },
  required: true,
})

export const stabilityAi = createPiece({
  displayName: "Stability AI",
  minimumSupportedRelease: '0.5.0',
  logoUrl: "https://cdn.activepieces.com/pieces/stability-ai.png",
  authors: ["Willianwg","AbdulTheActivepiecer"],
  auth: stabilityAiAuth,
  actions: [textToImage],
  triggers: [],
});
