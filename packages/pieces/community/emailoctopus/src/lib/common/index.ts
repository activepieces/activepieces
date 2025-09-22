import { httpClient, HttpMethod, AuthenticationType } from '@activepieces/pieces-common';

const EMAILOCTOPUS_API_BASE_URL = 'https://api.emailoctopus.com';

export const emailoctopusAuth = {
    type: 'SECRET_TEXT' as const,
    displayName: 'API Key',
    description: 'Your EmailOctopus API key',
    required: true,
};

export const emailoctopusCommon = {
    baseUrl: EMAILOCTOPUS_API_BASE_URL,

    async apiCall({
        auth,
        method,
        resourceUri,
        body = undefined,
        queryParams = undefined,
    }: {
        auth: string;
        method: HttpMethod;
        resourceUri: string;
        body?: any;
        queryParams?: Record<string, string>;
    }) {
        const response = await httpClient.sendRequest({
            method: method,
            url: `${EMAILOCTOPUS_API_BASE_URL}${resourceUri}`,
            body,
            queryParams,
            authentication: {
                type: AuthenticationType.BEARER_TOKEN,
                token: auth,
            }
        });

        if (response.status >= 400) {
            const errorBody = response.body;
            let errorMessage = `HTTP ${response.status}`;

            if (errorBody && typeof errorBody === 'object') {
                if (errorBody.title && errorBody.detail) {
                    errorMessage = `${errorBody.title}: ${errorBody.detail}`;
                } else if (errorBody.message) {
                    errorMessage = errorBody.message;
                } else if (errorBody.error) {
                    errorMessage = errorBody.error;
                }

                if (errorBody.type) {
                    errorMessage += ` (Type: ${errorBody.type})`;
                }
            }

            throw new Error(`EmailOctopus API Error: ${errorMessage}`);
        }

        return response;
    }
};

import * as schemas from './schemas';
export const emailoctopusSchemas = {
    addUpdateContact: schemas.addUpdateContact,
    findContact: schemas.findContact,
    unsubscribeContact: schemas.unsubscribeContact,
    updateContactEmail: schemas.updateContactEmail,
    addTagToContact: schemas.addTagToContact,
    removeTagFromContact: schemas.removeTagFromContact,
    createList: schemas.createList,
};
