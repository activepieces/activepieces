import { createPiece, PieceAuth } from "@activepieces/pieces-framework";
import { PieceCategory } from "@activepieces/shared";
import { createCustomApiCallAction } from "@activepieces/pieces-common";
import { magicalApiAuth } from "./lib/common/auth";
import { BASE_URL } from "./lib/common/client";
import { reviewResume } from "./lib/actions/review-resume";
import { parseResume } from "./lib/actions/parse-resume";
import { getProfileData } from "./lib/actions/get-profile-data";
import { getCompanyData } from "./lib/actions/get-company-data";
import { scoreResume } from "./lib/actions/score-resume";

export const magicalApi = createPiece({
  displayName: "Magical API",
  auth: magicalApiAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: "https://cdn.activepieces.com/pieces/magical-api.png",
  authors: [],
  actions: [
    parseResume,
    reviewResume,
    getProfileData,
    getCompanyData,
    scoreResume,
    createCustomApiCallAction({
      auth: magicalApiAuth,
      baseUrl: () => BASE_URL,
      authMapping: async (auth) => {
        return {
          'api-key': auth as string,
        };
      },
    }),
  ],
  triggers: [],
});