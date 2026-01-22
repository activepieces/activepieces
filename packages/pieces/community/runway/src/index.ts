
import { createPiece } from "@activepieces/pieces-framework";
import { PieceCategory } from "@activepieces/shared";
import { runwayAuth } from "./lib/common/auth";
import { generateImageFromText } from "./lib/actions/generate-image-from-text";
import { generateVideoFromImage } from "./lib/actions/generate-video-from-image";
import { getTaskDetails } from "./lib/actions/get-task-details";
import { cancelOrDeleteTask } from "./lib/actions/cancel-or-delete-task";

export const runway = createPiece({
  displayName: "Runway",
  description: "AI-powered content generation platform for creating high-quality images and videos using text prompts",
  auth: runwayAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: "https://cdn.activepieces.com/pieces/runway.png",
  categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE],
  authors: ["sparkybug"],
  actions: [generateImageFromText, generateVideoFromImage, getTaskDetails, cancelOrDeleteTask],
  triggers: [],
});
    