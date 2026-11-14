import { createPiece, PieceCategory } from "@activepieces/pieces-framework";
import { askDeepseek } from "./lib/actions/ask-deepseek";
import { deepseekAuth } from './lib/auth';

export const deepseek = createPiece({
  displayName: "DeepSeek",
  auth: deepseekAuth,
  categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE],
  minimumSupportedRelease: '0.88.2',
  logoUrl: "https://cdn.activepieces.com/pieces/deepseek.png",
  authors: ["PFernandez98"],
  actions: [askDeepseek],
  triggers: [],
});
