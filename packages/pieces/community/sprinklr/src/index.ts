import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { sprinklrAuth } from './lib/auth';
import { sprinklrClient } from './lib/common/client';
import { getCaseAction } from './lib/actions/get-case';
import { searchCasesAction } from './lib/actions/search-cases';
import { createCaseAction } from './lib/actions/create-case';
import { updateCaseAction } from './lib/actions/update-case';
import { addCaseCommentAction } from './lib/actions/add-case-comment';
import { findProfileAction } from './lib/actions/find-profile';
import { runReportAction } from './lib/actions/run-report';
import { newCase } from './lib/triggers/new-case';
import { updatedCase } from './lib/triggers/updated-case';

export const sprinklr = createPiece({
  displayName: 'Sprinklr',
  description: 'Customer experience platform for customer service, social media and marketing.',
  auth: sprinklrAuth,
  minimumSupportedRelease: '0.88.2',
  logoUrl: 'https://cdn.activepieces.com/pieces/sprinklr.png',
  categories: [PieceCategory.CUSTOMER_SUPPORT, PieceCategory.SALES_AND_CRM],
  authors: ['ibrahim-abuznaid'],
  actions: [
    getCaseAction,
    searchCasesAction,
    createCaseAction,
    updateCaseAction,
    addCaseCommentAction,
    findProfileAction,
    runReportAction,
    createCustomApiCallAction({
      auth: sprinklrAuth,
      baseUrl: (auth) => sprinklrClient.customApiBaseUrl(auth),
      authMapping: async (auth) => sprinklrClient.customApiAuthMapping(auth),
    }),
  ],
  triggers: [newCase, updatedCase],
});
