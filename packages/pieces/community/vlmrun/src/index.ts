
import { createPiece, PieceAuth } from "@activepieces/pieces-framework";
import { analyzeAudio } from "./lib/actions/analyze-audio";
import { analyzeDocument } from "./lib/actions/analyze-document";
import { analyzeImage } from "./lib/actions/analyze-image";
import { analyzeVideo } from "./lib/actions/analyze-video";
import { getFileById } from "./lib/actions/get-file";
import { VlmRunAuth } from "./lib/common/auth";

export const vlmrun = createPiece({
  displayName: "Vlmrun",
  auth: VlmRunAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: "https://cdn.activepieces.com/pieces/vlmrun.png",
  authors: ["Niket2035"],
  actions: [analyzeAudio, analyzeDocument, analyzeImage, analyzeVideo, getFileById],
  triggers: [],
});
