import { PieceAuth, Property } from '@activepieces/pieces-framework';

import { validateServiceAccountConnection } from './common/service-account';

const locationDescription =
  'Multi-region where your processors live: `us` or `eu` (the Document AI console shows it next to each processor). Other regional locations work too when Google offers them for your processor type.';

const serviceAccountInstructions = `
Connect with a **service account** from **your own** Google Cloud project (recommended: flows run without anyone signing in):

1. In [Google Cloud Console](https://console.cloud.google.com/), select or create a project with **billing enabled** (Document AI charges per page). **APIs & Services → Library**: enable **Cloud Document AI API**.
2. **Document AI → Processors**: create the processors you need (e.g. Enterprise Document OCR, Form Parser, Invoice Parser) and note their **location** (\`us\` or \`eu\`).
3. **IAM & Admin → Service Accounts → Create**. Grant it the role **Document AI API User** (\`roles/documentai.apiUser\`) on the project. Open the account, **Keys → Add key → JSON** and download the key file.
4. Paste the **whole JSON key file** below and fill in the processors' location. The project is read from the key file unless you override it.
`.trim();

const oauthInstructions = `
Sign in with a Google account that can use Document AI in **your own** Google Cloud project:

1. In [Google Cloud Console](https://console.cloud.google.com/), select or create a project with **billing enabled** (Document AI charges per page). **APIs & Services → Library**: enable **Cloud Document AI API**.
2. **APIs & Services → OAuth consent screen**: add the scope \`https://www.googleapis.com/auth/cloud-platform\`. While the app is in *Testing*, add the Google accounts that will connect as test users. The account needs the **Document AI API User** role on the project.
3. **APIs & Services → Credentials → Create credentials → OAuth client ID**, type *Web application*. Add the **Redirect URL shown below** to *Authorized redirect URIs*.
4. Paste the **Client ID** and **Client Secret**, fill in the **Project ID** and the processors' **location**, then sign in.
`.trim();

export const DOCUMENT_AI_SCOPE = 'https://www.googleapis.com/auth/cloud-platform';

export const googleDocumentAiScopes = [DOCUMENT_AI_SCOPE, 'email'];

export const DEFAULT_LOCATION = 'us';

export const googleDocumentAiServiceAccount = PieceAuth.CustomAuth({
  displayName: 'Service Account (Recommended)',
  description: serviceAccountInstructions,
  required: true,
  props: {
    keyFile: PieceAuth.SecretText({
      displayName: 'Service Account Key (JSON)',
      description: 'The full content of the key file downloaded from Google Cloud (starts with `{ "type": "service_account", …`).',
      required: true,
    }),
    location: Property.ShortText({
      displayName: 'Location',
      description: locationDescription,
      required: true,
      defaultValue: DEFAULT_LOCATION,
    }),
    projectId: Property.ShortText({
      displayName: 'Project ID (Override)',
      description: 'Only when the processors live in a project other than the key file\'s `project_id`.',
      required: false,
    }),
  },
  validate: async ({ auth }) => validateServiceAccountConnection(auth),
});

export const googleDocumentAiOAuth2 = PieceAuth.OAuth2({
  displayName: 'Google Account (OAuth2)',
  description: oauthInstructions,
  authUrl: 'https://accounts.google.com/o/oauth2/auth',
  tokenUrl: 'https://oauth2.googleapis.com/token',
  required: true,
  scope: googleDocumentAiScopes,
  props: {
    projectId: Property.ShortText({
      displayName: 'Project ID',
      description: 'Google Cloud project that owns the processors (the ID, e.g. `my-company-prod`, not the number or the name).',
      required: true,
    }),
    location: Property.ShortText({
      displayName: 'Location',
      description: locationDescription,
      required: true,
      defaultValue: DEFAULT_LOCATION,
    }),
  },
});

export const googleDocumentAiAuth = [googleDocumentAiServiceAccount, googleDocumentAiOAuth2];
