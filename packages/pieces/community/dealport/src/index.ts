import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { findContactAction } from './lib/actions/find-contact';
import { findOwnerAction } from './lib/actions/find-owner';
import { getRecordAction } from './lib/actions/get-record';
import { matchCompanyListAction } from './lib/actions/match-company-list';
import { previewCompaniesAction } from './lib/actions/preview-companies';
import { searchBuildingsAction } from './lib/actions/search-buildings';
import { searchCompaniesAction } from './lib/actions/search-companies';
import { dealportAuth } from './lib/auth';
import { assertDealportUrl, DEALPORT_BASE_URL } from './lib/common/client';

export const dealport = createPiece({
  displayName: 'Dealport',
  description:
    'The SMB knowledge layer for agents and humans: 28M+ US private companies, commercial buildings, cited public filings, and verified human owner contacts.',
  auth: dealportAuth,
  minimumSupportedRelease: '0.88.2',
  logoUrl: 'https://app.dealport.com/icon.svg',
  categories: [
    PieceCategory.SALES_AND_CRM,
    PieceCategory.BUSINESS_INTELLIGENCE,
  ],
  authors: ['rkmasiello'],
  actions: [
    previewCompaniesAction,
    searchCompaniesAction,
    searchBuildingsAction,
    getRecordAction,
    findOwnerAction,
    findContactAction,
    matchCompanyListAction,
    createCustomApiCallAction({
      auth: dealportAuth,
      baseUrl: () => DEALPORT_BASE_URL,
      authMapping: async (auth, propsValue) => {
        const urlField = (propsValue as Record<string, unknown>)?.['url'];
        const rawUrl =
          typeof urlField === 'object' && urlField !== null
            ? (urlField as Record<string, unknown>)['url']
            : urlField;
        assertDealportUrl(rawUrl);
        return {
          Authorization: `Bearer ${auth.secret_text.trim()}`,
        };
      },
    }),
  ],
  triggers: [],
});
