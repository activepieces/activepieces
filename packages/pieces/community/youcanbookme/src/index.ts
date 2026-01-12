import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { newBooking } from './lib/triggers/new-booking';
import { PieceCategory } from '@activepieces/shared';
import { createprofile } from './lib/actions/create-profile';
import { retrieveBookingById } from './lib/actions/retrieve-booking-by-id';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { youcanbookmeAuth } from './lib/common/auth';

export const youcanbookme = createPiece({
  displayName: 'YouCanBookMe',
  auth: youcanbookmeAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/youcanbookme.png',
  categories: [PieceCategory.SALES_AND_CRM],
  description:
    'YouCanBookMe is an online scheduling tool that helps you manage appointments and bookings efficiently.',
  authors: ['sanket-a11y'],
  actions: [
    createprofile,
    retrieveBookingById,
    createCustomApiCallAction({
      auth: youcanbookmeAuth,
      baseUrl: () => 'https://api.youcanbook.me/v1',
      authMapping: async (auth) => ({
        Authorization: `Bearer ${auth.secret_text}`,
      }),
    }),
  ],
  triggers: [newBooking],
});
