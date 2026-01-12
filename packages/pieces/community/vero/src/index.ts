import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { veroAuth } from './lib/common/auth';
import { aliasAUser } from './lib/actions/alias-a-user';
import { createOrUpdateUser } from './lib/actions/create-or-update-user';
import { deleteUser } from './lib/actions/delete-user';
import { resubscribeUser } from './lib/actions/resubscribe-user';
import { updateUsersTags } from './lib/actions/update-users-tags';
import { unsubscribe } from './lib/actions/unsubscribe';
import { trackEvent } from './lib/actions/track-event';
import { emailBounced } from './lib/triggers/email-bounced';
import { emailClicked } from './lib/triggers/email-clicked';
import { emailComplained } from './lib/triggers/email-complained';
import { emailConverted } from './lib/triggers/email-converted';
import { emailDelivered } from './lib/triggers/email-delivered';
import { emailOpened } from './lib/triggers/email-opened';
import { emailSent } from './lib/triggers/email-sent';
import { newUser } from './lib/triggers/new-user';
import { updateUser } from './lib/triggers/update-user';
import { unsubscribeUser } from './lib/triggers/unsubscribe-user';
import { resubscribeUserTrigger } from './lib/triggers/resubscribe-user';

export const vero = createPiece({
  displayName: 'Vero',
  auth: veroAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/vero.png',
  description:
    'Vero is an event-based messaging platform. Increase conversions and customer satisfaction by sending more targeted emails.',
  categories: [PieceCategory.COMMUNICATION],
  authors: ['sanket-a11y'],
  actions: [
    aliasAUser,
    createOrUpdateUser,
    deleteUser,
    resubscribeUser,
    trackEvent,
    unsubscribe,
    updateUsersTags,
  ],
  triggers: [
    emailBounced,
    emailClicked,
    emailComplained,
    emailConverted,
    emailDelivered,
    emailOpened,
    emailSent,
    newUser,
    resubscribeUserTrigger,
    unsubscribeUser,
    updateUser,
  ],
});
