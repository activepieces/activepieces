import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  HttpMethod,
  createCustomApiCallAction,
  httpClient,
} from '@activepieces/pieces-common';
import { baseUrlv1 } from './lib/common/common';
import { promptCompletion } from './lib/actions/prompt-completion';
import { imageGeneration } from './lib/actions/image-generation';
import { fileUpload } from './lib/actions/file-upload';
import { createRag } from './lib/actions/rag-create';
import { listRags } from './lib/actions/rag-list';
import { getRagById } from './lib/actions/rag-get-by-id';
import { updateRag } from './lib/actions/rag-update';
import { deleteRag } from './lib/actions/rag-delete';
import { ragPromptCompletion } from './lib/actions/rag-prompt-completion';
import { agentCreate } from './lib/actions/agent-create';
import { agentAddRag } from './lib/actions/agent-add-rag';
import { agentList } from './lib/actions/agent-list';
import { agentDelete } from './lib/actions/agent-delete';
import { agentUpdate } from './lib/actions/agent-update';
import { agentGet } from './lib/actions/agent-get';
import { agentPromptCompletion } from './lib/actions/agent-prompt-completion';
import { PieceCategory } from '@activepieces/shared';

const markdownDescription = `
Follow these instructions to get your Straico API Key:

1. Visit the following website: https://platform.straico.com/user-settings.
2. Once on the website, locate "Connect with Straico API" and click on the copy API Key.
`;

export const straicoAuth = PieceAuth.SecretText({
  description: markdownDescription,
  displayName: 'API Key',
  required: true,
  validate: async (auth) => {
    try {
      await httpClient.sendRequest<{
        data: { model: string }[];
      }>({
        url: `${baseUrlv1}/models`,
        method: HttpMethod.GET,
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: auth.auth as string,
        },
      });
      return {
        valid: true,
      };
    } catch (e) {
      return {
        valid: false,
        error: 'Invalid API key',
      };
    }
  },
});

export const straico = createPiece({
  displayName: 'Straico',
  auth: straicoAuth,
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/straico.png',
  categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE],
  description: 'All-in-one generative AI platform',
  authors: ['dennisrongo'],
  actions: [
    promptCompletion,
    imageGeneration,
    fileUpload,
    createRag,
    listRags,
    getRagById,
    updateRag,
    deleteRag,
    ragPromptCompletion,
    agentCreate,
    agentAddRag,
    agentList,
    agentDelete,
    agentUpdate,
    agentGet,
    agentPromptCompletion,
    createCustomApiCallAction({
      auth: straicoAuth,
      baseUrl: () => baseUrlv1,
      authMapping: async (auth) => {
        return {
          Authorization: `Bearer ${auth}`,
        };
      },
    }),
  ],
  triggers: [],
});
