import { createPiece } from '@activepieces/pieces-framework';
import { oncehubAuth } from './lib/common/auth';
import { PieceCategory } from '@activepieces/shared';
import { findContact } from './lib/actions/find-contact';
import { createContact } from './lib/actions/create-contact';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { bookingCanceled } from './lib/triggers/booking-canceled';
import { bookingCanceledThenRescheduled } from './lib/triggers/booking-canceled-then-rescheduled';
import { bookingCompleted } from './lib/triggers/booking-completed';
import { bookingNoshow } from './lib/triggers/booking-no-show';
import { bookingRescheduled } from './lib/triggers/booking-rescheduled';
import { bookingScheduled } from './lib/triggers/booking-scheduled';
import { conversationAbandoned } from './lib/triggers/conversation-abandoned';
import { conversationClosed } from './lib/triggers/conversation-closed';
import { conversationStarted } from './lib/triggers/conversation-started';

export const oncehub = createPiece({
  displayName: 'Oncehub',
  auth: oncehubAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/oncehub.png',
  categories: [PieceCategory.SALES_AND_CRM],
  description:
    'Build meaningful on-brand scheduling experiences with OnceHubs online appointment booking software',
  authors: ['sanket-a11y'],
  actions: [
    findContact,
    createContact,
    createCustomApiCallAction({
      auth: oncehubAuth,
      baseUrl: () => `https://api.oncehub.com/v2`,
      authMapping: async (auth) => ({
        'API-Key': `${auth.secret_text}`,
      }),
    }),
  ],
  triggers: [
    bookingCanceledThenRescheduled,
    bookingCanceled,
    bookingCompleted,
    bookingNoshow,
    bookingRescheduled,
    bookingScheduled,
    conversationAbandoned,
    conversationClosed,
    conversationStarted,
  ],
});
