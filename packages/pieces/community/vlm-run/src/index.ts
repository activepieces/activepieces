import { createPiece, PieceAuth } from "@activepieces/pieces-framework";
import { PieceCategory } from "@activepieces/shared";
import { vlmRunAuth } from "./lib/common/auth";

import { analyzeAudioAction } from "./lib/actions/analyze-audio";
import { analyzeDocumentAction } from "./lib/actions/analyze-document";
import { analyzeImageAction } from "./lib/actions/analyze-image";
import { analyzeVideoAction } from "./lib/actions/analyze-video";
import { getFileAction } from "./lib/actions/get-file";


export const vlmRun = createPiece({
    displayName: "VLM-run",
    auth: vlmRunAuth,
    minimumSupportedRelease: '0.36.1',
    logoUrl: "https://cdn.activepieces.com/pieces/vlm-run.png",
    authors: [],
    categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE],
    actions: [
      analyzeAudioAction,
      analyzeDocumentAction,
      analyzeImageAction,
      analyzeVideoAction,
      getFileAction
    ],
    triggers: [],
});