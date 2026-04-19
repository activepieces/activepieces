import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { getSiteStats } from './lib/actions/get-site-stats.action';
import { listSites } from './lib/actions/list-sites.action';
import { getCurrentVisitors } from './lib/actions/get-current-visitors.action';
import { newConversion } from './lib/triggers/new-conversion.trigger';

export const fathomAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: 'Your Fathom Analytics API key from usefathom.com/account/api',
  required: true,
});

export const fathom = createPiece({
  displayName: 'Fathom Analytics',
  description: 'Privacy-focused website analytics',
  auth: fathomAuth,
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/fathom.png',
  categories: [PieceCategory.ANALYTICS],
  authors: ['Tosh94'],
  actions: [getSiteStats, listSites, getCurrentVisitors],
  triggers: [newConversion],
});
