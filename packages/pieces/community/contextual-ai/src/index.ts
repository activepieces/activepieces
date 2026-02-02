
import { PieceAuth, createPiece, Property } from "@activepieces/pieces-framework";
import { PieceCategory } from '@activepieces/shared';
import { ContextualAI } from 'contextual-client';
import { queryAgentAction } from './lib/actions/query-agent';
import { generateAction } from './lib/actions/generate';
import { ingestDocumentAction } from './lib/actions/ingest-document';
import { parseFileAction } from './lib/actions/parse-file';
import { createAgentAction } from './lib/actions/create-agent';
import { inviteUsersAction } from './lib/actions/invite-users';
import { createDatastoreAction } from './lib/actions/create-datastore';
import { newAgentTrigger } from './lib/triggers/new-agent';

const markdown = `
## Contextual AI Connection Setup

### Prerequisites
- Create a Contextual AI account at [Contextual AI](https://contextual.ai)
- Generate an API key from your workspace settings
- You'll receive $25 in free credits (or $50 with work email)

### Authentication Fields

**API Key**: Your Contextual AI API key (required)
- Sign in to your Contextual AI workspace
- Navigate to API Keys in the sidebar
- Click "Create API Key" and follow the instructions
- Copy the generated key and paste it here

**Base URL**: The API base URL (optional)
- Leave blank to use the default: \`https://api.contextual.ai/v1\`
- Only change if you have a custom deployment
`;

export const contextualAiAuth = PieceAuth.CustomAuth({
  required: true,
  description: markdown,
  props: {
    apiKey: PieceAuth.SecretText({
      displayName: 'API Key',
      description: 'Your Contextual AI API key',
      required: true,
    }),
    baseUrl: Property.ShortText({
      displayName: 'Base URL',
      description: 'API base URL (leave blank for default)',
      required: false,
    }),
  },
  validate: async ({ auth }) => {
    try {
      const { apiKey, baseUrl } = auth;

      const client = new ContextualAI({
        apiKey: apiKey,
        baseURL: baseUrl || 'https://api.contextual.ai/v1',
      });

      await client.datastores.list();

      return {
        valid: true,
      };
    } catch (error) {
      return {
        valid: false,
        error: `Authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}. Please verify your API key and base URL.`,
      };
    }
  },
});

export const contextualAi = createPiece({
  displayName: "Contextual AI",
  description: "Integrate with Contextual AI to automate document processing and AI workflows",
  auth: contextualAiAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: "https://cdn.activepieces.com/pieces/contextual-ai.png",
  categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE],
  authors: ["onyedikachi-david"],
  actions: [queryAgentAction, generateAction, ingestDocumentAction, parseFileAction, createAgentAction, inviteUsersAction, createDatastoreAction],
  triggers: [newAgentTrigger],
});
    