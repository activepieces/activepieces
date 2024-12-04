import { createPiece, PieceAuth } from "@activepieces/pieces-framework";
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { deleteContact } from './lib/actions/delete-contact';
import { addOrUpdateContact } from './lib/actions/add-or-update-contact';
import { createEvent } from "./lib/actions/create-event";
import { BASE_URL } from "./lib/common/constants";
import { InstasentAuthType } from './lib/common/types';
import { PieceCategory } from "@activepieces/shared";

export const getBaseUrl = (auth: { projectId: string, datasourceId: string }) => {
    return `${BASE_URL}/project/${auth.projectId}/datasource/${auth.datasourceId}`;
};

export const instasentAuth = PieceAuth.CustomAuth({
    description: 'Authentication for Instasent',
    props: {
        projectId: PieceAuth.SecretText({
            displayName: 'Project ID',
            description: 'Your Instasent Project ID',
            required: true,
        }),
        datasourceId: PieceAuth.SecretText({
            displayName: 'Datasource ID',
            description: 'Your Instasent Datasource ID',
            required: true,
        }),
        apiKey: PieceAuth.SecretText({
            displayName: 'API Key',
            description: 'Your Instasent API Bearer Token',
            required: true,
        })
    },
    validate: async ({ auth }) => {
        const authData = auth as InstasentAuthType;

        try {
            const baseUrl = getBaseUrl(authData);
            const response = await httpClient.sendRequest({
                method: HttpMethod.GET,
                url: `${baseUrl}/stream`,
                headers: {
                    'Authorization': `Bearer ${auth.apiKey}`
                }
            });

            const data = response.body;
            if (!data.organization || !data.stream || !data.datasource || !data.project) {
                return {
                    valid: false,
                    error: 'Invalid API response structure'
                };
            }

            return {
                valid: true
            };
        } catch (error: any) {
            return {
                valid: false,
                error: error.response?.data?.message || 'Invalid credentials or connection error'
            };
        }
    },
    required: true
});

export const instasent = createPiece({
    displayName: "Instasent",
    minimumSupportedRelease: '0.30.0',
    logoUrl: "https://cdn.activepieces.com/pieces/instasent.jpg",
    categories:[PieceCategory.MARKETING],
    authors: ["dev-instasent", "https://github.com/dev-instasent"],
    auth: instasentAuth,
    actions: [addOrUpdateContact, deleteContact, createEvent],
    triggers: [],
});
