
import { createPiece } from "@activepieces/pieces-framework";
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { serpstatAuth } from "./lib/common/auth";
import { getKeywords } from "./lib/actions/keyword-analysis/get-keywords";
import { getSuggestions } from "./lib/actions/keyword-analysis/get-suggestions";
import { BASE_URL } from "./lib/common/client";

export const serpstat = createPiece({
  displayName: "Serpstat",
  auth: serpstatAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: "https://cdn.activepieces.com/pieces/serpstat.png",
  authors: [],
  actions: [
    getKeywords,
    getSuggestions,
    createCustomApiCallAction({
      auth: serpstatAuth,
      baseUrl: () => BASE_URL,
      authLocation: 'queryParams',
      authMapping: async (auth) => {
        return {
          token: auth as string,
        };
      },
    }),
  ],
  triggers: [],
});
    