import { AppConnectionValueForAuthProperty, PieceAuth, Property } from '@activepieces/pieces-framework';

export const vertexAiAuth = PieceAuth.CustomAuth({
  description: `
  To authenticate with Google Vertex AI using a Service Account:
  1. Go to [Google Cloud Console](https://console.cloud.google.com).
  2. Create a new project or select an existing one.
  3. Enable the **Vertex AI API** under *APIs & Services > Enabled APIs*.
  4. Create a Service Account:
     - Go to **IAM & Admin > Service Accounts**.
     - Click **Create Service Account**, fill in the details and click **Create**.
     - Grant the **Vertex AI User** role.
  5. Create a JSON key:
     - Click on the created service account.
     - Go to the **Keys** tab.
     - Click **Add Key > Create new key**, choose **JSON** and click **Create**.
     - The JSON key file will be downloaded automatically.
  6. Copy the **entire contents** of the downloaded JSON file and paste it below.
  `,
  required: true,
  props: {
    serviceAccountJson: Property.LongText({
      displayName: 'Service Account JSON',
      description: 'The complete JSON content from your Google Service Account key file.',
      required: true,
    }),
  },
  validate: async ({ auth }) => {
    try {
      const credentials = JSON.parse(auth.serviceAccountJson);

      if (!credentials.type || credentials.type !== 'service_account') {
        return { valid: false, error: 'Invalid service account JSON: missing or incorrect "type" field.' };
      }
      if (!credentials.project_id) {
        return { valid: false, error: 'Invalid service account JSON: missing "project_id" field.' };
      }
      if (!credentials.private_key) {
        return { valid: false, error: 'Invalid service account JSON: missing "private_key" field.' };
      }
      if (!credentials.client_email) {
        return { valid: false, error: 'Invalid service account JSON: missing "client_email" field.' };
      }

      const { JWT } = await import('google-auth-library');
      const jwtClient = new JWT({
        email: credentials.client_email,
        key: credentials.private_key.replace(/\\n/g, '\n'),
        scopes: ['https://www.googleapis.com/auth/cloud-platform'],
      });

      await jwtClient.authorize();

      return { valid: true };
    } catch (e) {
      if (e instanceof SyntaxError) {
        return { valid: false, error: 'Invalid JSON format. Please copy the complete service account JSON file.' };
      }
      return { valid: false, error: `Authentication failed: ${e instanceof Error ? e.message : 'Unknown error'}` };
    }
  },
});

export type GoogleVertexAIAuthValue = AppConnectionValueForAuthProperty<typeof vertexAiAuth>;
