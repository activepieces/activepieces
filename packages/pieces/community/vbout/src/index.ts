import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { addContactAction } from './lib/actions/add-contact';
import { addTagToContactAction } from './lib/actions/add-tag-to-contact';
import { createEmailMarketingCampaignAction } from './lib/actions/create-campaign';
import { createEmailListAction } from './lib/actions/create-email-list';
import { createSocialMediaMessageAction } from './lib/actions/create-social-media-message';
import { getContactByEmailAction } from './lib/actions/get-contact-by-email';
import { getEmailListAction } from './lib/actions/get-email-list';
import { removeTagFromContactAction } from './lib/actions/remove-tag-from-contact';
import { unsubscribeContactAction } from './lib/actions/unsubscribe-contact';
import { updateContactAction } from './lib/actions/update-contact';
import { makeClient } from './lib/common';

const markdown = `
To obtain your API key, follow these steps:

1.Go to **settings** by clicking your profile-pic (top-right).\n
2.Navigate to **API Integrations** section.\n
3.Under **API USER KEY** ,copy API key.\n
`;

export const vboutAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  required: true,
  description: markdown,
  async validate({ auth }) {
    const client = makeClient(auth as string);
    try {
      await client.validateAuth();
      return {
        valid: true,
      };
    } catch (e) {
      return {
        valid: false,
        error: 'Invalid API key.',
      };
    }
  },
});

export const vbout = createPiece({
  displayName: 'VBOUT',
  description: 'Marketing automation platform for agencies',
  auth: vboutAuth,
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/vbout.png',
  authors: ["kishanprmr","abuaboud"],
  categories: [PieceCategory.MARKETING],
  actions: [
    addContactAction,
    addTagToContactAction,
    createEmailListAction,
    createEmailMarketingCampaignAction,
    createSocialMediaMessageAction,
    getContactByEmailAction,
    getEmailListAction,
    removeTagFromContactAction,
    unsubscribeContactAction,
    updateContactAction,
  ],
  triggers: [],
});
