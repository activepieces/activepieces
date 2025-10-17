import { PieceAuth, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';


export interface CyberArkAuth {
    pvwaUrl: string;
    username: string;
    password: string;
}

export const cyberarkAuth = PieceAuth.CustomAuth({
    description: `
    Provide your CyberArk PVWA (Password Vault Web Access) details.
    1. Enter your **PVWA URL** (e.g., \`https://cyberark.mycompany.com\`).
    2. Enter a **Username** with the necessary permissions.
    3. Enter the **Password** for that user.
    `,
    required: true,
    props: {
        pvwaUrl: Property.ShortText({
            displayName: 'PVWA URL',
            description: 'The base URL of your CyberArk PVWA instance.',
            required: true,
        }),
        username: Property.ShortText({
            displayName: 'Username',
            description: 'The username for logging into CyberArk PAS.',
            required: true,
        }),
        password: PieceAuth.SecretText({
            displayName: 'Password',
            description: 'The password for the CyberArk user.',
            required: true,
        }),
    },
    validate: async ({ auth }) => {
        const pvwaUrl = (auth as CyberArkAuth).pvwaUrl.replace(/\/$/, "");
        try {
            await httpClient.sendRequest({
                method: HttpMethod.POST,
                url: `${pvwaUrl}/PasswordVault/API/auth/Logon`,
                body: {
                    username: (auth as CyberArkAuth).username,
                    password: (auth as CyberArkAuth).password,
                },
            });
            return {
                valid: true,
            };
        } catch (e) {
            return {
                valid: false,
                error: 'Login failed. Please check your PVWA URL, Username, and Password.',
            };
        }
    },
});