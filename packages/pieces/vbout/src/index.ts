import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { vboutGetContactByEmailAction } from './lib/actions/get-contact-by-email';
import { vboutGetEmailListAction } from './lib/actions/get-email-list';
import { vboutCreateEmailListAction } from './lib/actions/create-email-list';
import { vboutAddContactAction } from './lib/actions/add-contact';
import { vboutUpdateContactAction } from './lib/actions/update-contact';
import { vboutAddTagAction } from './lib/actions/add-tag-to-contact';
import { vboutAddEmailMarketingCampaignAction } from './lib/actions/create-campaign';
import { vboutUnsubscribeContactAction } from './lib/actions/unsubscribe-contact';
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
});
export const vbout = createPiece({
  displayName: 'Vbout',
  auth: vboutAuth,
  minimumSupportedRelease: '0.9.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/vbout.png',
  authors: ['kishanprmr'],
  actions: [
    vboutGetContactByEmailAction,
    vboutGetEmailListAction,
    vboutCreateEmailListAction,
    vboutAddContactAction,
    vboutUpdateContactAction,
    vboutAddTagAction,
    vboutAddEmailMarketingCampaignAction,
    vboutUnsubscribeContactAction,
  ],
  triggers: [],
});
