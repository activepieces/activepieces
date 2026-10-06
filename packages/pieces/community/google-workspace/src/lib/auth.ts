import { PieceAuth, Property } from '@activepieces/pieces-framework';

import { validateServiceAccount } from './common/service-account';

export const googleWorkspaceScopes = [
  'https://www.googleapis.com/auth/admin.directory.user',
  'https://www.googleapis.com/auth/admin.directory.group',
  'https://www.googleapis.com/auth/admin.directory.group.member',
  'https://www.googleapis.com/auth/admin.directory.orgunit',
  'https://www.googleapis.com/auth/admin.directory.device.mobile',
  'https://www.googleapis.com/auth/admin.directory.device.chromeos',
  'https://www.googleapis.com/auth/admin.directory.rolemanagement',
  'https://www.googleapis.com/auth/admin.directory.userschema.readonly',
  'https://www.googleapis.com/auth/admin.datatransfer',
  'https://www.googleapis.com/auth/admin.reports.audit.readonly',
];

const delegationScopeList = googleWorkspaceScopes.map((scope) => `   - \`${scope}\``).join('\n');

const oauthInstructions = `
Sign in as a **Google Workspace administrator** with an OAuth client from **your own** Google Cloud project:

1. In [Google Cloud Console](https://console.cloud.google.com/), select or create a project. **APIs & Services → Library**: enable **Admin SDK API**.
2. **APIs & Services → OAuth consent screen**: add the Admin SDK scopes this connection requests (users, groups, org units, devices, roles, data transfer, audit reports). While the app is in *Testing*, add the administrators that will connect as test users.
3. **APIs & Services → Credentials → Create credentials → OAuth client ID**, type *Web application*. Add the **Redirect URL shown below** to *Authorized redirect URIs*.
4. Paste the **Client ID** and **Client Secret** here and sign in with an administrator account. The account's admin role decides what the connection can do.
`.trim();

const serviceAccountInstructions = `
Connect with a **service account** that has **domain-wide delegation**, so flows run without an administrator signing in:

1. In [Google Cloud Console](https://console.cloud.google.com/), enable **Admin SDK API**, then **IAM & Admin → Service Accounts → Create**. Open the account, **Keys → Add key → JSON** and download the key file.
2. In the [Admin console](https://admin.google.com/) go to **Security → Access and data control → API controls → Manage domain-wide delegation → Add new**. Paste the service account's numeric **Client ID** (from the key file, \`client_id\`) and, as scopes (comma-separated), exactly these:
${delegationScopeList}
3. Fill in below the key file's \`client_email\` and \`private_key\` (the whole value, with or without its line breaks), plus the e-mail of the **administrator the service account acts as**. Delegation can take a few minutes to propagate.
`.trim();

export const googleWorkspaceOAuth2 = PieceAuth.OAuth2({
  displayName: 'Google Account (OAuth2)',
  description: oauthInstructions,
  authUrl: 'https://accounts.google.com/o/oauth2/auth',
  tokenUrl: 'https://oauth2.googleapis.com/token',
  required: true,
  scope: [...googleWorkspaceScopes, 'email'],
});

export const googleWorkspaceServiceAccount = PieceAuth.CustomAuth({
  displayName: 'Service Account (Domain-Wide Delegation)',
  description: serviceAccountInstructions,
  required: true,
  props: {
    clientEmail: Property.ShortText({
      displayName: 'Service Account E-mail',
      description: 'The `client_email` of the key file, e.g. `automation@my-project.iam.gserviceaccount.com`.',
      required: true,
    }),
    privateKey: PieceAuth.SecretText({
      displayName: 'Private Key',
      description:
        'The `private_key` of the key file: the whole PEM block from `-----BEGIN PRIVATE KEY-----` to `-----END PRIVATE KEY-----`. Line breaks do not matter: the literal `\\n` of the JSON file, real newlines or a single line all work.',
      required: true,
    }),
    adminEmail: Property.ShortText({
      displayName: 'Administrator to Impersonate',
      description: "E-mail of a Workspace administrator in your domain. The service account acts with this user's admin role.",
      required: true,
    }),
  },
  validate: async ({ auth }) => validateServiceAccount(auth),
});

export const googleWorkspaceAuth = [googleWorkspaceOAuth2, googleWorkspaceServiceAccount];
