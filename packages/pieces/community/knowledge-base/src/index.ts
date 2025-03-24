import { createPiece, PieceAuth, Property } from '@activepieces/pieces-framework';
import { searchKnowledgeBase, getMasterData } from './lib/actions/search-knowledge-base';

export const knowledgeBaseAuth = PieceAuth.BasicAuth({
  required: true,
  username: Property.ShortText({
    displayName: 'Username',
    required: true,
  }),
  password: PieceAuth.SecretText({
    displayName: 'Password',
    required: true,
  }),
  validate: async ({ auth }) => {
    const { username, password } = auth;
    if (!username || !password) {
      return {
        valid: false,
        error: 'Empty Username or Password',
      };
    }
    try {
      const masterData = await getMasterData();
      const response = await fetch(masterData.CENTER_AUTH_LOGIN_URL, {
        method: 'POST',
        body: JSON.stringify({
          username: username,
          password: password,
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });
      if (response.status === 200) {
        return {
          valid: true,
        };
      }
      else {
        return {
          valid: false,
          error: 'Invalid Username or Password',
        };
      }
    } catch (e) {
      return {
        valid: false,
        error: 'Invalid Username or Password',
      };
    }
  },
});

export const knowledgeBase = createPiece({
  displayName: "Avalant Knowledge Base",
  description: "Search for content in Avalant's knowledge base",
  auth: knowledgeBaseAuth,
  minimumSupportedRelease: "0.36.1",
  logoUrl: "https://i.ibb.co/6QYsWLD/Knowledge.png",
  authors: ["rupalbarman"],
  actions: [searchKnowledgeBase],
  triggers: [],
});
