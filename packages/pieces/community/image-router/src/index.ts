import { createPiece } from "@activepieces/pieces-framework";
import { imageRouterAuth } from "./lib/auth";
import { PieceCategory } from '@activepieces/pieces-framework';
import { createImageAction } from "./lib/actions/create-image";
import { imageToImageAction } from "./lib/actions/image-to-image";

export const imageRouter = createPiece({
  displayName: "ImageRouter",
  auth: imageRouterAuth,
  minimumSupportedRelease: '0.36.1',
  categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE],
  description: "Generate images with any model available on ImageRouter.",
  logoUrl: "https://cdn.activepieces.com/pieces/image-router.png",
  authors: ["onyedikachi-david"],
  actions: [
    createImageAction,
    imageToImageAction,
  ],
  triggers: [],
});
