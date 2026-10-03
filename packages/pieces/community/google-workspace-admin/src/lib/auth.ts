import {
  AppConnectionType,
  AppConnectionValueForAuthProperty,
  PieceAuth,
  Property,
} from '@activepieces/pieces-framework';
import { JWT } from 'google-auth-library';

export const googleWorkspaceAdminScopes = [
  'https://www.googleapis.com/auth/admin.directory.user',
  'https://www.googleapis.com/auth/admin.directory.user.security',
  'https://www.googleapis.com/auth/admin.directory.group',
  'https://www.googleapis.com/auth/admin.directory.orgunit',
  'https://www.googleapis.com/auth/admin.directory.rolemanagement',
  'https://www.googleapis.com/auth/admin.directory.device.mobile',
  'https://www.googleapis.com/auth/admin.directory.domain.readonly',
  'https://www.googleapis.com/auth/admin.directory.customer.readonly',
  'https://www.googleapis.com/auth/apps.licensing',
  'https://www.googleapis.com/auth/admin.datatransfer',
  'https://www.googleapis.com/auth/admin.reports.audit.readonly',
];

export const googleWorkspaceAdminAuth = [
  PieceAuth.OAuth2({
    description:
      'Sign in with a Google Workspace **super admin** account (or an admin whose role grants the Admin SDK privileges you need).',
    authUrl: 'https://accounts.google.com/o/oauth2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    required: true,
    scope: googleWorkspaceAdminScopes,
  }),
  PieceAuth.CustomAuth({
    displayName: 'Service Account (Advanced)',
    description: `Use a service account with domain-wide delegation:

1. In https://console.cloud.google.com/ enable the **Admin SDK API**, **Enterprise License Manager API** and **Admin Data Transfer API**.
2. Go to **IAM & Admin > Service Accounts**, create a service account, then **Keys > Add key > JSON** and paste the file below.
3. In the Admin console (https://admin.google.com) go to **Security > Access and data control > API controls > Manage Domain Wide Delegation**, click **Add new**, paste the service account's **Client ID** and these scopes:

\`${googleWorkspaceAdminScopes.join(',')}\`

4. Enter the email of an admin user for the service account to act as.`,
    required: true,
    props: {
      serviceAccount: Property.LongText({
        displayName: 'Service Account JSON Key',
        required: true,
      }),
      adminEmail: Property.ShortText({
        displayName: 'Admin Email',
        description:
          'Email of a Workspace admin to impersonate, e.g. admin@yourcompany.com. The Admin SDK only accepts requests made on behalf of an admin.',
        required: true,
      }),
    },
    validate: async ({ auth }) => {
      try {
        await getAccessToken({ type: AppConnectionType.CUSTOM_AUTH, props: { ...auth } });
        return { valid: true };
      } catch (e) {
        return { valid: false, error: e instanceof Error ? e.message : String(e) };
      }
    },
  }),
];

export async function getAccessToken(auth: GoogleWorkspaceAdminAuthValue): Promise<string> {
  if (auth.type !== AppConnectionType.CUSTOM_AUTH) {
    return auth.access_token;
  }
  let serviceAccount: { client_email?: string; private_key?: string };
  try {
    serviceAccount = JSON.parse(auth.props.serviceAccount);
  } catch {
    throw new Error('Invalid Service Account JSON Key. Please paste the full JSON key file.');
  }
  const client = new JWT({
    email: serviceAccount.client_email,
    key: serviceAccount.private_key,
    scopes: googleWorkspaceAdminScopes,
    subject: auth.props.adminEmail,
  });
  const { token } = await client.getAccessToken();
  if (!token) {
    throw new Error('Could not retrieve an access token from the service account JSON key.');
  }
  return token;
}

export type GoogleWorkspaceAdminAuthValue = AppConnectionValueForAuthProperty<
  typeof googleWorkspaceAdminAuth
>;
