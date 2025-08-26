import { createPiece, PieceAuth, Property } from '@activepieces/pieces-framework';
import { searchKnowledgeBase, getMasterData } from './lib/actions/search-knowledge-base';
import { addToKnowledgeBase } from './lib/actions/add-to-knowledge-base';

export const Production = "PromptX";
export const Test = "Staging";

export const knowledgeBaseAuth = PieceAuth.CustomAuth({
  required: true,
  props: {
    server: Property.StaticDropdown({
      displayName: 'Server',
      options: {
        options: [
          {
            label: Production,
            value: Production,
          },
          {
            label: Test,
            value: Test,
          },
        ],
      },
      required: true,
      defaultValue: Production
    }),
    username: Property.ShortText({
      displayName: 'Username',
      required: true,
    }),
    password: PieceAuth.SecretText({
      displayName: 'Password',
      required: true,
    }),
  },
  validate: async ({ auth }) => {
    const { username, password } = auth;
    if (!username || !password) {
      return {
        valid: false,
        error: 'Empty Username or Password',
      };
    }
    try {
      const masterData = await getMasterData(auth);
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
  displayName: "PromptX Knowledge Base",
  description: "PromptX Knowledge Base",
  auth: knowledgeBaseAuth,
  minimumSupportedRelease: "0.36.1",
  logoUrl: "https://ml.oneweb.tech/public_img_main/images/PromptXAI/PromptXAI_c5008fdcd9a94d61b293c1080ebec834.png",
  authors: ["rupalbarman"],
  actions: [searchKnowledgeBase, addToKnowledgeBase],
  triggers: [],
});
