
    import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { OAuth2PropertyValue } from '@activepieces/pieces-framework';

// Import auth
import { googleChatAuth } from './lib/common/auth';

// Import actions
import { sendMessageAction } from './lib/actions/send-message';
import { getDirectMessageDetailsAction } from './lib/actions/get-direct-message-details';
import { addSpaceMemberAction } from './lib/actions/add-space-member';
import { getMessageAction } from './lib/actions/get-message';
import { searchMessagesAction } from './lib/actions/search-messages';
import { findMemberAction } from './lib/actions/find-member';

// Import triggers
import { newMessageTrigger } from './lib/triggers/new-message';
import { newMentionTrigger } from './lib/triggers/new-mention';

    export const googleChat = createPiece({
      displayName: 'Google Chat',
      description: 'Communication and collaboration platform within Google Workspace',
      minimumSupportedRelease: '0.36.1',
      logoUrl: 'https://cdn.activepieces.com/pieces/google-chat.png',
      categories: [PieceCategory.COMMUNICATION],
      auth: googleChatAuth,
      authors: ['pranjal'],
      actions: [
        sendMessageAction,
        getDirectMessageDetailsAction,
        addSpaceMemberAction,
        getMessageAction,
        searchMessagesAction,
        findMemberAction,
        createCustomApiCallAction({
          baseUrl: () => 'https://chat.googleapis.com/v1',
          auth: googleChatAuth,
          authMapping: async (auth) => ({
            Authorization: `Bearer ${(auth as OAuth2PropertyValue).access_token}`,
          }),
        }),
      ],
      triggers: [
        newMessageTrigger,
        newMentionTrigger,
      ],
    });
    