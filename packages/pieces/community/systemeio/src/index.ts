import { PieceAuth, createPiece } from '@activepieces/pieces-framework';
import { systemeioCreateContact } from './lib/actions/create-contact';
import { systemeioUpdateContact } from './lib/actions/update-contact';
import { systemeioAddTagToContact } from './lib/actions/add-tag-to-contact';
import { systemeioRemoveTagFromContact } from './lib/actions/remove-tag-from-contact';
import { systemeioFindContactByEmail } from './lib/actions/find-contact-by-email';
import { systemeioNewContactTrigger } from './lib/triggers/new-contact';
import { systemeioNewSaleTrigger } from './lib/triggers/new-sale';
import { systemeioNewTagAddedTrigger } from './lib/triggers/new-tag-added';

export const systemeioAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: 'Enter your Systeme.io API Key from the dashboard (Profile > Public API keys)',
  required: true,
});

export const systemeio = createPiece({
  displayName: 'Systeme.io',
  logoUrl: 'https://cdn.activepieces.com/pieces/systemeio.png',
  auth: systemeioAuth,
  authors: ['YourName'],
  actions: [
    systemeioCreateContact,
    systemeioUpdateContact,
    systemeioAddTagToContact,
    systemeioRemoveTagFromContact,
    systemeioFindContactByEmail,
  ],
  triggers: [
    systemeioNewContactTrigger,
    systemeioNewSaleTrigger,
    systemeioNewTagAddedTrigger,
  ],
}); 