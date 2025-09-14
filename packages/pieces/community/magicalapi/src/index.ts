import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { magicalApiAuth } from './lib/common/auth';
import { parseResume } from './lib/actions/parse-resume';
import { reviewResume } from './lib/actions/review-resume';
import { getProfileData } from './lib/actions/get-profile-data';
import { getCompanyData } from './lib/actions/get-company-data';
import { scoreResume } from './lib/actions/score-resume';

export const magicalapi = createPiece({
  displayName: 'MagicalAPI',
  description: 'Parse resumes, review & score them, and enrich leads with profile or company data',
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/magicalapi.png',
  categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE, PieceCategory.BUSINESS_INTELLIGENCE],
  authors: ['activepieces'],
  auth: magicalApiAuth,
  actions: [
    parseResume,
    reviewResume,
    scoreResume,
    getProfileData,
    getCompanyData,
    createCustomApiCallAction({
      baseUrl: () => 'https://api.magicalapi.com/v1',
      auth: magicalApiAuth,
      authMapping: async (auth) => ({
        'Authorization': `Bearer ${auth}`,
      }),
    }),
  ],
  triggers: [],
});
