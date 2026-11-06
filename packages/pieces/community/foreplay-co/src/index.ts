import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { findAds, findBoards, findBrands, getAdById, getAdsByPage } from './lib/actions';
import { discoverBrandsByAds } from './lib/actions/ai/discover-brands-by-ads';
import { findBrandsByDomain } from './lib/actions/ai/find-brands-by-domain';
import { getAd } from './lib/actions/ai/get-ad';
import { getBrandAnalytics } from './lib/actions/ai/get-brand-analytics';
import { getCreditUsage } from './lib/actions/ai/get-credit-usage';
import { getLensReport } from './lib/actions/ai/get-lens-report';
import { getSpyderBrand } from './lib/actions/ai/get-spyder-brand';
import { getSpyderTopAds } from './lib/actions/ai/get-spyder-top-ads';
import { listAdDuplicates } from './lib/actions/ai/list-ad-duplicates';
import { listBoardAds } from './lib/actions/ai/list-board-ads';
import { listBoardBrands } from './lib/actions/ai/list-board-brands';
import { listBoards } from './lib/actions/ai/list-boards';
import { listBrandAds } from './lib/actions/ai/list-brand-ads';
import { listPageAds } from './lib/actions/ai/list-page-ads';
import { listSpyderBrandAds } from './lib/actions/ai/list-spyder-brand-ads';
import { listSpyderBrands } from './lib/actions/ai/list-spyder-brands';
import { listSpyderRankedAds } from './lib/actions/ai/list-spyder-ranked-ads';
import { listSpyderRelatedPages } from './lib/actions/ai/list-spyder-related-pages';
import { listSwipefileAds } from './lib/actions/ai/list-swipefile-ads';
import { searchAds } from './lib/actions/ai/search-ads';
import { searchBrands } from './lib/actions/ai/search-brands';
import { foreplayCoAuth } from './lib/auth';
import { FOREPLAY_API_URL, foreplayClient } from './lib/common/client';
import { newAdInBoard, newAdInSpyder, newSwipefileAd } from './lib/triggers';

const foreplayCo = createPiece({
  displayName: 'Foreplay',
  description: 'Competitive advertising data and creative insights platform. Search, filter, and analyze ads and brands with live and historical ad creatives, metadata, and competitive intelligence.',
  auth: foreplayCoAuth,
  minimumSupportedRelease: '0.88.2',
  logoUrl: 'https://cdn.activepieces.com/pieces/foreplay-co.png',
  categories: [PieceCategory.MARKETING],
  authors: ['fortunamide', 'onyedikachi-david', 'OdaiAhmed99'],
  actions: [
    getAdById,
    getAdsByPage,
    findBrands,
    findAds,
    findBoards,
    searchAds,
    getAd,
    listAdDuplicates,
    listPageAds,
    listBrandAds,
    searchBrands,
    findBrandsByDomain,
    discoverBrandsByAds,
    getBrandAnalytics,
    listBoards,
    listBoardBrands,
    listBoardAds,
    listSwipefileAds,
    listSpyderBrands,
    getSpyderBrand,
    listSpyderBrandAds,
    getSpyderTopAds,
    listSpyderRankedAds,
    listSpyderRelatedPages,
    getCreditUsage,
    getLensReport,
    createCustomApiCallAction({
      baseUrl: () => FOREPLAY_API_URL,
      auth: foreplayCoAuth,
      authMapping: async (auth, propsValue) => {
        const urlProp = propsValue['url'];
        const url = foreplayClient.isRecord(urlProp) && typeof urlProp['url'] === 'string' ? urlProp['url'].trim() : '';
        if (/^[a-z][a-z0-9+.-]*:/i.test(url) || url.startsWith('//')) {
          let parsed: URL | undefined;
          try {
            parsed = new URL(url);
          } catch {
            parsed = undefined;
          }
          if (!parsed || parsed.username || parsed.password || parsed.origin !== new URL(FOREPLAY_API_URL).origin) {
            throw new Error(`The URL must be relative or start with ${FOREPLAY_API_URL}/.`);
          }
        }
        if (url.split(/[/?#]/).some((part) => part === '..' || part.toLowerCase() === '%2e%2e')) {
          throw new Error('The URL must not contain ".." segments.');
        }
        return { Authorization: foreplayClient.keyOf(auth) };
      },
    }),
  ],
  triggers: [newAdInSpyder, newAdInBoard, newSwipefileAd],
});

export { foreplayCo, foreplayCoAuth };
