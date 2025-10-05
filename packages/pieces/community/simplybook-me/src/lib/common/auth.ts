

import { PieceAuth, Property } from "@activepieces/pieces-framework";
import { httpClient, HttpMethod } from "@activepieces/pieces-common";


export const simplybookMeApiUrl = 'https://user-api-v2.simplybook.me';


export type SimplybookMeAuthData = {
    company_login: string;
    token: string;
    secretKey: string;
};

export const simplybookMeAuth = PieceAuth.CustomAuth({
    description: `
    To get your connection details:
    1.  **Company Login**: This is your unique company identifier on Simplybook.me.
    2.  **API Token**: You need to generate a token via the API.
        - You can use a tool like Postman or curl to make a POST request to \`${simplybookMeApiUrl}/admin/auth\`.
        - The request body should be a JSON object like this:
          \`\`\`json
          {
            "company": "YOUR_COMPANY_LOGIN",
            "login": "YOUR_ADMIN_EMAIL",
            "password": "YOUR_ADMIN_PASSWORD"
          }
          \`\`\`
        - The API response will contain an \`auth_token\`. Paste that token below.
    `,
    required: true, 
    props: {
        company_login: Property.ShortText({
            displayName: 'Company Login',
            description: 'Your company login for Simplybook.me.',
            required: true,
        }),
        token: Property.ShortText({
            displayName: 'API Token (auth_token)',
            description: 'The API token obtained from the authentication endpoint.',
            required: true,
        }),
         secretKey: Property.ShortText({
            displayName: 'API Secret Key',
            description: 'Navigate to Plugins > API > Settings in your admin panel to find your key.',
            required: true,
        }),
        webhookSecret: Property.ShortText({
            displayName: 'Webhook Secret Key',
            description: 'Found in Plugins > API > Webhooks. Used for verifying incoming events.',
            required: true,
        }),
    },
    validate: async ({ auth }) => {
        try {
            await httpClient.sendRequest({
                method: HttpMethod.GET,
                url: `${simplybookMeApiUrl}/admin/additional-fields`,
                headers: {
                    'X-Company-Login': auth.company_login as string,
                    'X-Token': auth.token as string,
                },
                queryParams: {
                    'page[limit]': '1'
                }
            });
            return {
                valid: true,
            };
        } catch (e) {
            return {
                valid: false,
                error: 'Invalid Company Login or API Token.',
            };
        }
    },
});