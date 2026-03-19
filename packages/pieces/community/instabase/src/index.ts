
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { PieceAuth, createPiece, Property } from "@activepieces/pieces-framework";
import { PieceCategory } from '@activepieces/shared';
import { HttpMethod, httpClient, AuthenticationType } from '@activepieces/pieces-common';
import { converseWithDocumentAction } from './lib/actions/converse-with-document';
import { createConversationAction } from './lib/actions/create-conversation';
import { newConversationTrigger } from './lib/triggers/new-conversation';
import { instabaseAuth } from './lib/auth';

const markdown = `
## Instabase AI Hub Connection Setup

### Prerequisites
- Create an AI Hub account at [Instabase](https://www.instabase.com)
- Generate an API token from your account settings
- Obtain your organization ID or user ID for the IB-Context header

### Authentication Fields

**API Token**: Your API token from Instabase (required for Bearer authentication)

**IB Context**: Your organization ID or user ID
- For organization accounts: Use your organization ID
- For community accounts: Use your user ID or omit this field

**API Root URL**: The base URL for API calls
- For community accounts: \`https://aihub.instabase.com/api\`
- For organization accounts: \`https://your-organization.instabase.com/api\` (replace with your custom domain)
`;

export const instabase = createPiece({
  displayName: "Instabase",
  description: "Integrate with Instabase AI Hub to automate document processing and AI workflows",
  auth: instabaseAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: "https://cdn.activepieces.com/pieces/instabase.png",
  categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE],
  authors: ["onyedikachi-david"],
  actions: [
    createConversationAction,
    converseWithDocumentAction,
    createCustomApiCallAction({
      baseUrl: (auth) => auth ? auth.props.apiRoot : '',
      auth: instabaseAuth,
      authMapping: async (auth) => {
        const headers: Record<string, string> = {
          'Authorization': `Bearer ${auth.props.apiToken}`,
        };
        const ibContext = auth.props.ibContext;
        if (ibContext) {
          headers['IB-Context'] = ibContext;
        }
        return headers;
      },
    }),
  ],
  triggers: [
    newConversationTrigger,
  ],
});
    