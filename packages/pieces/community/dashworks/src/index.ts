
import { createPiece } from "@activepieces/pieces-framework";
import { PieceCategory } from "@activepieces/shared";
import { generateAnswerAction } from "./lib/actions/generate-answer";
import { createCustomApiCallAction } from "@activepieces/pieces-common";
import { dashworksAuth } from "./lib/common/auth";

export const dashworks = createPiece({
  displayName: "Dashworks",
  categories: [PieceCategory.PRODUCTIVITY],
  auth: dashworksAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: "https://cdn.activepieces.com/pieces/dashworks.png",
  authors: ["kishanprmr"],
  actions: [generateAnswerAction,
    createCustomApiCallAction({
      auth: dashworksAuth,
      baseUrl: () => 'https://api.dashworks.ai/v1/',
      authMapping: async (auth) => {
        return {
          Authorization: `Bearer ${auth.secret_text}`
        }
      }
    })
  ],
  triggers: [],
});
