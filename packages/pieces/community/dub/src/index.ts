import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { createLink } from './lib/actions/create-link.action';
import { listLinks } from './lib/actions/list-links.action';
import { getAnalytics } from './lib/actions/get-analytics.action';
import { newClick } from './lib/triggers/new-click.trigger';

export const dubAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: 'Your Dub.co API key from app.dub.co/settings/api',
  required: true,
});

export const dub = createPiece({
  displayName: 'Dub',
  description: 'Open-source link management and short URLs',
  auth: dubAuth,
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/dub.png',
  categories: [PieceCategory.MARKETING],
  authors: ['Tosh94'],
  actions: [createLink, listLinks, getAnalytics],
  triggers: [newClick],
});
