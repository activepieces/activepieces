import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { jobspipeAuth } from './lib/auth';
import { searchJobsAction } from './lib/actions/search-jobs';
import { getCompanyProfileAction } from './lib/actions/get-company-profile';

export const jobspipe = createPiece({
    displayName: 'JobsPipe',
    description: 'Search live job postings and company profiles from 30+ job boards and ATS platforms.',
    minimumSupportedRelease: '0.36.1',
    logoUrl: 'https://cdn.activepieces.com/pieces/jobspipe.png',
    categories: [PieceCategory.BUSINESS_INTELLIGENCE],
    auth: jobspipeAuth,
    authors: ['lololosys'],
    actions: [
        searchJobsAction,
        getCompanyProfileAction,
        createCustomApiCallAction({
            baseUrl: () => 'https://api.jobspipe.dev',
            auth: jobspipeAuth,
            authMapping: async (auth) => ({
                Authorization: `Bearer ${auth.secret_text}`,
            }),
        }),
    ],
    triggers: [],
});
