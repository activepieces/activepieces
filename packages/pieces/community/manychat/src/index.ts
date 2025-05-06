import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { findUserByCustomField } from './lib/actions/find-user-by-custom-field';
import { createSubscriber } from './lib/actions/create-subscriber';
import { sendContentToUser } from './lib/actions/send-content-to-user';
import { setCustomField } from './lib/actions/set-custom-fields';
import { unubscribeUserFromSequence } from './lib/actions/unubscribe-user-from-sequence';
import { removeTagFromUser } from './lib/actions/remove-tag-from-user';
import { addTagToUser } from './lib/actions/add-tag-to-user';
import { findUserByName } from './lib/actions/find-user-by-name';

export const manychatAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  required: true,
  description: 'Please use **test-key** as value for API Key',
});

export const manychat = createPiece({
  displayName: 'Manychat',
  auth: manychatAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/manychat.png',
  authors: [],
  actions: [
    addTagToUser,
    createSubscriber,
    findUserByCustomField,
    findUserByName,
    removeTagFromUser,
    sendContentToUser,
    setCustomField,
    unubscribeUserFromSequence,
  ],
  triggers: [],
});
