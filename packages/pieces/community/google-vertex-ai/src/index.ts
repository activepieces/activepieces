import { PieceAuth, createPiece, Property } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { generateContentWithGemini } from './lib/actions/generate-content-with-gemini';

const markdownDescription = `
Follow these instructions to get your Service Account JSON:
1. Go to the Google Cloud Console (https://console.cloud.google.com)
2. Navigate to "IAM & Admin" > "Service Accounts"
3. Create a new service account or select an existing one
4. Create a new key (JSON format) for the service account
5. Download the JSON key file
6. Copy the contents of the JSON file and paste it here

Make sure the service account has the following roles:
- Vertex AI User (roles/aiplatform.user)
`;

export const googleVertexAuth = PieceAuth.CustomAuth({
  required: true,
  props: {
    serviceAccountJson: Property.LongText({
      displayName: 'Service Account JSON',
      required: true,
      description: markdownDescription,
    }),
  },
});

export const googleVertex = createPiece({
  displayName: 'Google Vertex AI',
  auth: googleVertexAuth,
  description: 'Interact with Google Vertex AI services',
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/google-vertex-ai.png',
  categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE],
  authors: ["geekyme"],
  actions: [generateContentWithGemini],
  triggers: [],
});
    