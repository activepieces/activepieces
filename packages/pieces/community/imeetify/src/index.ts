import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { appointmentEvent } from './lib/triggers/appointment-event';

export const imeetify = createPiece({
  displayName: 'iMeetify',
  description:
    'Online appointment scheduling: receive appointment confirmation and cancellation events via webhook.',
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/imeetify.png',
  categories: [PieceCategory.PRODUCTIVITY],
  authors: ['sanket-a11y'],
  actions: [],
  triggers: [appointmentEvent],
});
