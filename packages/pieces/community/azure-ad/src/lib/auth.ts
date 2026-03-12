import { OAuth2PropertyValue, PieceAuth } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

const authDescription = `
To connect to Azure Active Directory (Microsoft Entra ID), you need to register an application in the Azure portal.

1. Go to [Azure Portal](https://portal.azure.com) → **Microsoft Entra ID** (or Azure Active Directory) → **App registrations** → **New registration**.
2. Enter a name, select supported account types, and set the **Redirect URI** to **Web** and use: {{redirectUrl}}
3. After creation, go to **API permissions** → **Add a permission** → **Microsoft Graph** → **Delegated permissions**.
4. Add at least: **User.Read.All**, **User.ReadWrite.All**, **Group.ReadWrite.All**, **Directory.Read.All**, **LicenseAssignment.ReadWrite.All**, and **User.RevokeSessions.All** (required for the Revoke Sign-in Session action).
5. Grant admin consent if required by your tenant.
6. Under **Certificates & secrets**, create a client secret and use it with the Application (client) ID and Directory (tenant) ID in the connection.
`;

export const azureAdAuth = PieceAuth.OAuth2({
    description: authDescription,
    authUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
    tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
    required: true,
    scope: [
    scope: [
        'User.Read.All',
        'User.ReadWrite.All',
        'Group.ReadWrite.All',
        'Directory.Read.All',
        'LicenseAssignment.ReadWrite.All',
        'User.RevokeSessions.All',
        'offline_access',
    ],
    validate: async ({ auth }) => {
        try {
            const token = (auth as OAuth2PropertyValue).access_token;
            await httpClient.sendRequest({
                method: HttpMethod.GET,
                url: 'https://graph.microsoft.com/v1.0/me',
                headers: { Authorization: `Bearer ${token}` },
            });
            return { valid: true };
        } catch {
            return { valid: false, error: 'Invalid or expired token. Please reconnect.' };
        }
    },
});
