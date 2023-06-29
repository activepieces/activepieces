import { Property } from "@activepieces/pieces-framework";
import { HttpRequest, HttpMethod, httpClient, AuthenticationType } from "@activepieces/pieces-common";

export const docsCommon = {
    baseUrl: 'https://docs.googleapis.com/v1',
    authentication: Property.OAuth2({
        displayName: 'Authentication',
        authUrl: "https://accounts.google.com/o/oauth2/auth",
        tokenUrl: "https://oauth2.googleapis.com/token",
        required: true,
        scope: ["https://www.googleapis.com/auth/documents"]
    }),
    title: Property.ShortText({
        displayName: 'Document Title',
        required: true
    }),
    body: Property.LongText({
        displayName: 'Document Content',
        required: true
    }),

    // Creates an empty document with the title provided
    createDocument: async (title: string, accessToken: string) => {
        const createRequest = await httpClient.sendRequest({
            url: `${docsCommon.baseUrl}/documents`,
            method: HttpMethod.POST,
            authentication: {
                type: AuthenticationType.BEARER_TOKEN,
                token: accessToken,
            },
            body: {
                title: title
            }
        });

        return createRequest.body;
    },

    // Writes provided content to the end of an existing document
    writeToDocument: async (documentId: number, body: string, accessToken: string) => {
        const writeRequest = await httpClient.sendRequest({
            url: `${docsCommon.baseUrl}/documents/${documentId}:batchUpdate`,
            method: HttpMethod.POST,
            authentication: {
                type: AuthenticationType.BEARER_TOKEN,
                token: accessToken,
            },
            body: {
                requests: [
                    {
                        insertText: {
                            text: body,
                            endOfSegmentLocation: {}
                        }
                    }
                ]
            }
        })

        return writeRequest.body;
    }
}