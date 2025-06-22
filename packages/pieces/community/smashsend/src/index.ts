import {
  createPiece,
  PieceAuth,
  Property,
} from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { SmashSend } from '@smashsend/node';

// Actions
import { createContactAction } from './lib/actions/create-contact';
import { updateContactAction } from './lib/actions/update-contact';
import { deleteContactAction } from './lib/actions/delete-contact';
import { getContactAction } from './lib/actions/get-contact';
import { searchContactAction } from './lib/actions/search-contact';
import { listContactsAction } from './lib/actions/list-contacts';

// Triggers
import { contactCreatedTrigger } from './lib/triggers/contact-created';
import { contactUpdatedTrigger } from './lib/triggers/contact-updated';
import { contactDeletedTrigger } from './lib/triggers/contact-deleted';
import { contactUnsubscribedTrigger } from './lib/triggers/contact-unsubscribed';
import { contactResubscribedTrigger } from './lib/triggers/contact-resubscribed';

const authGuide = `
To obtain your SMASHSEND API Key, follow these steps:

1. Log in to your SMASHSEND account at smashsend.com
2. Navigate to **Settings** → **API Keys**
3. Click on **Create API Key** and give it a descriptive name
4. Copy the generated API key and paste it below

Need help? Visit smashsend.com/docs or contact support
`;

export const smashsendAuth = PieceAuth.CustomAuth({
  required: true,
  description: authGuide,
  props: {
    apiKey: Property.ShortText({
      displayName: 'API Key',
      description: 'Your SMASHSEND API key for secure access',
      required: true,
    }),
  },
  validate: async ({ auth }) => {
    try {
      const client = new SmashSend(auth.apiKey);
      // Use the proper API key validation method
      const validation = await client.apiKeys.validate();
      return validation.valid ? { valid: true } : { valid: false, error: 'API key validation failed' };
    } catch (error: any) {
      return {
        valid: false,
        error: error.message || 'Invalid API key',
      };
    }
  },
});

export const smashsend = createPiece({
  displayName: 'SMASHSEND',
  description: 'Next-generation email marketing platform for building meaningful customer relationships through powerful automation, real-time analytics, and seamless contact management',
  auth: smashsendAuth,
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/smashsend.png',
  categories: [PieceCategory.MARKETING],
  authors: ["jorgeferreiro","activepieces"],
  actions: [
    createContactAction,
    searchContactAction,
    updateContactAction,
    getContactAction,
    listContactsAction,
    deleteContactAction,
  ],
  triggers: [
    contactCreatedTrigger,
    contactUpdatedTrigger,
    contactDeletedTrigger,
    contactUnsubscribedTrigger,
    contactResubscribedTrigger,
  ],
}); 