import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { createCompanyAction } from './lib/actions/create-company';
import { createContactAction } from './lib/actions/create-contact';
import { searchCompanyAction } from './lib/actions/search-company';
import { searchContactAction } from './lib/actions/search-contact';
import { updateCompanyAction } from './lib/actions/update-company';
import { updateContactAction } from './lib/actions/update-contact';
import { mauticAiActions } from './lib/actions/ai';
import { mauticAuth } from './lib/auth';
import { mauticClient } from './lib/common/client';
import { contactChannelSubscriptionChangedTrigger } from './lib/triggers/contact-channel-subscription-changed';
import { contactCompanyChangedTrigger } from './lib/triggers/contact-company-changed';
import { contactUpdatedTrigger } from './lib/triggers/contact-updated';
import { newContactTrigger } from './lib/triggers/new-contact';

export const mautic = createPiece({
  displayName: 'Mautic',
  description: 'Open-source marketing automation software',

  minimumSupportedRelease: '0.88.2',
  logoUrl: 'https://cdn.activepieces.com/pieces/mautic.png',
  authors: ["bibhuty-did-this","kanarelo","kishanprmr","MoShizzle","khaledmashaly","abuaboud"],
  categories: [PieceCategory.MARKETING],
  auth: mauticAuth,
  actions: [
    createContactAction,
    searchContactAction,
    updateContactAction,
    createCompanyAction,
    searchCompanyAction,
    updateCompanyAction,
    ...mauticAiActions,
    createCustomApiCallAction({
      auth: mauticAuth,
      baseUrl: (auth) => (auth ? mauticClient.baseUrl({ auth }) : ''),
      authMapping: async (auth) => {
        const { username, password } = auth.props;
        return {
          Authorization:
            'Basic ' +
            Buffer.from(`${username}:${password}`).toString('base64'),
          'Content-Type': 'application/json',
        };
      },
    }),
  ],
  triggers: [
    contactUpdatedTrigger,
    contactCompanyChangedTrigger,
    contactChannelSubscriptionChangedTrigger,
    newContactTrigger,
  ],
});
