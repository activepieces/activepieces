import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { newBooking } from './lib/triggers/new-booking';
import { PieceCategory } from '@activepieces/shared';

export const youcanbookme = createPiece({
  displayName: 'Youcanbookme',
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/youcanbookme.png',
  categories: [PieceCategory.SALES_AND_CRM],
  description:
    'YouCanBookMe is an online scheduling tool that helps you manage appointments and bookings efficiently.',
  authors: ['sanket-a11y'],
  actions: [],
  triggers: [newBooking],
});
