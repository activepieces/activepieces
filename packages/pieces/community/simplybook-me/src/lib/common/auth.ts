// src/lib/common/auth.ts

import { PieceAuth, Property } from "@activepieces/pieces-framework";
import { httpClient, HttpMethod } from "@activepieces/pieces-common";

export const simplybookMeApiUrl = 'https://user-api-v2.simplybook.me';

export type SimplybookMeAuthData = {
    company_login: string;
    token: string;
    secretKey: string;
};

export const simplybookMeAuth = PieceAuth.CustomAuth({
    required: true,
    description: `
    ### Authentication Guide
    1.  **Find Your Keys:** Log in to SimplyBook.me and go to **Plugins > API**.
        -   Copy your **Company Login**.
        -   In the **Settings** tab, copy your **API Secret Key**.
    2.  **Generate an API Token:** You must generate a token using a tool like Postman or Curl by making a POST request to \`${simplybookMeApiUrl}/admin/auth\` with your admin credentials. The response will contain a \`token\`.
    `,
    props: {
        company_login: Property.ShortText({
            displayName: 'Company Login',
            required: true,
        }),
        token: Property.ShortText({
            displayName: 'API Token',
            description: 'The token generated from the /admin/auth endpoint.',
            required: true,
        }),
        secretKey: Property.ShortText({
            displayName: 'API Secret Key',
            description: 'Found in Plugins > API > Settings.',
            required: true,
        }),
    },
    validate: async ({ auth }: { auth: SimplybookMeAuthData }) => {
        try {
            await httpClient.sendRequest({
                method: HttpMethod.GET,
                url: `${simplybookMeApiUrl}/admin/services`,
                headers: {
                    'X-Company-Login': auth.company_login,
                    'X-Token': auth.token,
                },
                queryParams: { 'limit': '1' }
            });
            return { valid: true };
        } catch (e) {
            return {
                valid: false,
                error: 'Invalid Company Login or API Token.',
            };
        }
    },
});