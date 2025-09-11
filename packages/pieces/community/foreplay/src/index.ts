import {
    createCustomApiCallAction,
} from '@activepieces/pieces-common';
import {
    createPiece,
} from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { foreplayAuth } from './lib/common/auth';

import { getAdById } from './lib/actions/get-ad-by-id';
import { getAdsByPage } from './lib/actions/get-ads-by-page';
import { findBrandsByDomain } from './lib/actions/find-brands-by-domain';
import { findAds } from './lib/actions/find-ads';
import { findBoard } from './lib/actions/find-board';

import { newAdInSpyder } from './lib/triggers/new-ad-in-spyder';
import { newAdInBoard } from './lib/triggers/new-ad-in-board';
import { newSwipefileAd } from './lib/triggers/new-swipefile-ad';

export const foreplay = createPiece({
    displayName: 'Foreplay',
    description: 'Search, filter, and analyze a vast database of ads and brands.',
    auth: foreplayAuth, 
    minimumSupportedRelease: '0.36.1',
    logoUrl: 'https://cdn.activepieces.com/pieces/foreplay.png',
    categories: [PieceCategory.MARKETING],
    authors: [],
    actions: [
        getAdById,
        getAdsByPage,
        findBrandsByDomain,
        findAds,
        findBoard,
        createCustomApiCallAction({
            auth: foreplayAuth,
            authMapping: async (auth) => {
                const { apiKey } = auth as { apiKey: string };
                return {
                    'Authorization': apiKey,
                };
            },
            baseUrl: () => {
                return 'https://public.api.foreplay.co';
            },
        }),
    ],
    triggers: [
      newAdInSpyder,
      newAdInBoard,
      newSwipefileAd
    ],
});