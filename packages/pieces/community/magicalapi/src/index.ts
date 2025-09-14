import { createPiece } from '@activepieces/pieces-framework';
import { getCompanyData } from './lib/actions/get-company-data';
import { getProfileData } from './lib/actions/get-profile-data';
import { parseResume } from './lib/actions/parse-resume';
import { reviewResume } from './lib/actions/review-resume';
import { scoreResume } from './lib/actions/score-resume';
import { magicalapiAuth } from './lib/common';

export const magicalapi = createPiece({
  displayName: 'MagicalAPI',
  description:
    'MagicalAPI provides tools to parse resumes, review & score them, and enrich leads with profile or company data (e.g. via LinkedIn), among other “Data Product” & “Resume Product” services. With this integration, you can automate parsing & enrichment workflows (from uploads, attachments, or form submissions) without manual work.',
  auth: magicalapiAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/magicalapi.png',
  authors: ['LuizDMM'],
  actions: [
    parseResume,
    reviewResume,
    getProfileData,
    getCompanyData,
    scoreResume,
  ],
  triggers: [],
});
