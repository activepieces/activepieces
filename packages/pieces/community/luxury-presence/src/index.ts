import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { newLead } from './lib/triggers/new-lead';
import { luxuryPresenceAuth } from './lib/common/auth';
import { PieceCategory } from '@activepieces/shared';

export const luxuryPresence = createPiece({
  displayName: 'Luxury Presence',
  auth: luxuryPresenceAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/luxury-presence.png',
  description:
    'Luxury Presence is a software company designed for real estate agents. Their all-in-one platform combines a CRM, website builder, marketing tools, and more to help agents grow their business and close more deals.',
  categories: [PieceCategory.SALES_AND_CRM],
  authors: ['sanket-a11y'],
  actions: [],
  triggers: [newLead],
});
