import { createCustomApiCallAction } from "@activepieces/pieces-common";
import { createPiece, PieceCategory } from "@activepieces/pieces-framework";

import { imageRouterAiActions } from "./lib/actions/ai";
import { createImageAction } from "./lib/actions/create-image";
import { imageToImageAction } from "./lib/actions/image-to-image";
import { imageRouterAuth } from "./lib/auth";
import { imageRouterClient } from "./lib/common/client";

export const imageRouter = createPiece({
  displayName: "ImageRouter",
  auth: imageRouterAuth,
  minimumSupportedRelease: '0.88.2',
  categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE],
  description: "Generate images with any model available on ImageRouter.",
  logoUrl: "https://cdn.activepieces.com/pieces/image-router.png",
  authors: ["onyedikachi-david"],
  actions: [
    createImageAction,
    imageToImageAction,
    ...imageRouterAiActions,
    createCustomApiCallAction({
      auth: imageRouterAuth,
      baseUrl: () => imageRouterClient.baseUrl(),
      authMapping: async (auth) => ({
        Authorization: `Bearer ${auth.secret_text}`,
      }),
    }),
  ],
  triggers: [],
});
