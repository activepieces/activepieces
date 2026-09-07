import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { scruppAuth } from './lib/auth';
import { enrichCompanyAction } from './lib/actions/enrich-company';
import { enrichLinkedinProfileAction } from './lib/actions/enrich-linkedin-profile';
import { exportSearchAction } from './lib/actions/export-search';
import { findDecisionMakersAction } from './lib/actions/find-decision-makers';
import { findEmailAction } from './lib/actions/find-email';
import { verifyEmailAction } from './lib/actions/verify-email';

export const scrupp = createPiece({
  displayName: 'Scrupp',
  description:
    'Export Sales Navigator, LinkedIn and Apollo searches into people, find decision makers at a company, enrich profiles, and find and verify email addresses.',
  auth: scruppAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://scrupp.com/img/logo.png',
  authors: ['scrupp'],
  categories: [PieceCategory.SALES_AND_CRM],
  actions: [
    enrichCompanyAction,
    enrichLinkedinProfileAction,
    exportSearchAction,
    findDecisionMakersAction,
    findEmailAction,
    verifyEmailAction,
  ],
  triggers: [],
});
