
import { createPiece, PieceAuth } from "@activepieces/pieces-framework";
import { getCompanyData } from "./lib/actions/get-company-data";
import { getProfileData } from "./lib/actions/get-profile-data";
import { parseResume } from "./lib/actions/parse-resume";
import { reviewResume } from "./lib/actions/review-resume";
import { scoreResume } from "./lib/actions/score-resume";
import { MagicalapiAuth } from "./lib/common/auth";
import { createCustomApiCallAction } from "@activepieces/pieces-common";

export const magicalapi = createPiece({
  displayName: "Magicalapi",
  auth: MagicalapiAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: "https://cdn.activepieces.com/pieces/magicalapi.png",
  authors: ['Niket2035'],
  actions: [
    getCompanyData,
    getProfileData,
    parseResume,
    reviewResume,
    scoreResume,
    createCustomApiCallAction({
      baseUrl: () => {
        return 'https://gw.magicalapi.com';
      },
      auth: MagicalapiAuth,
      authMapping: async (auth) => ({
        'api-key': `${auth}`,
        'Content-Type': 'application/json',
      }),
    })
  ],
  triggers: [],
});
