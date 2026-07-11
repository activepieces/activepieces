import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { dixaAuth } from './lib/auth';
import { DIXA_API_BASE_URL } from './lib/common/client';
import { addMessage } from './lib/actions/add-message';
import { claimConversation } from './lib/actions/claim-conversation';
import { closeConversation } from './lib/actions/close-conversation';
import { createConversation } from './lib/actions/create-conversation';
import { createNote } from './lib/actions/create-note';
import { getArticle } from './lib/actions/get-article';
import { getConversation } from './lib/actions/get-conversation';
import { listMessages } from './lib/actions/list-messages';
import { listNotes } from './lib/actions/list-notes';
import { setCustomContactAttributes } from './lib/actions/set-custom-contact-attributes';
import { tagConversation } from './lib/actions/tag-conversation';

export { dixaAuth } from './lib/auth';

export const dixa = createPiece({
  displayName: 'Dixa',
  description:
    'Omnichannel customer service platform for conversations, notes, and contact management',
  auth: dixaAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/dixa.png',
  authors: [],
  categories: [PieceCategory.CUSTOMER_SUPPORT],
  actions: [
    addMessage,
    claimConversation,
    closeConversation,
    createConversation,
    createNote,
    getArticle,
    getConversation,
    listMessages,
    listNotes,
    setCustomContactAttributes,
    tagConversation,
    createCustomApiCallAction({
      auth: dixaAuth,
      baseUrl: () => DIXA_API_BASE_URL,
      authMapping: async (auth) => ({
        Authorization: auth.secret_text,
      }),
    }),
  ],
  triggers: [],
});
