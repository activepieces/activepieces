import { createCustomApiCallAction } from '@activepieces/pieces-common';
import {
  createPiece,
  PieceAuth,
  Property,
} from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { addUsersToGroup } from './lib/actions/add-users-to-group.action';
import { changeUserTrustLevel } from './lib/actions/change-trust-level.action';
import { createPost } from './lib/actions/create-post.action';
import { createTopic } from './lib/actions/create-topic.action';
import { sendPrivateMessage } from './lib/actions/send-private-message.action';

const markdownPropertyDescription = `
*Get your api Key: https://discourse.yourinstance.com/admin/api/keys
`;

export const discourseAuth = PieceAuth.CustomAuth({
  description: markdownPropertyDescription,
  required: true,
  props: {
    api_key: PieceAuth.SecretText({
      displayName: 'API Key',
      required: true,
    }),
    api_username: Property.ShortText({
      displayName: 'API Username',
      required: true,
    }),
    website_url: Property.ShortText({
      displayName: 'Website URL',
      required: true,
      description:
        'URL of the discourse url i.e https://discourse.yourinstance.com',
    }),
  },
});

export const discourse = createPiece({
  displayName: 'Discourse',
  description: 'Modern open source forum software',
  auth: discourseAuth,
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/discourse.png',
  categories: [PieceCategory.COMMUNICATION],
  authors: ["pfernandez98","kishanprmr","MoShizzle","abuaboud"],
  actions: [
    createPost,
    createTopic,
    changeUserTrustLevel,
    addUsersToGroup,
    sendPrivateMessage,
    createCustomApiCallAction({
      baseUrl: (auth) => (auth as { website_url: string }).website_url.trim(), // Replace with the actual base URL
      auth: discourseAuth,
      authMapping: async (auth) => ({
        'Api-Key': (auth as { api_key: string }).api_key,
        'Api-Username': (auth as { api_username: string }).api_username,
      }),
    }),
  ],
  triggers: [],
});
