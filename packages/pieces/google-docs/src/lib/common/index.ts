import { Property, OAuth2PropertyValue } from "@activepieces/pieces-framework";
import { httpClient, HttpMethod, AuthenticationType, HttpRequest } from "@activepieces/pieces-common";
import { googleDocsAuth } from "../..";

export const docsCommon = {
    auth: googleDocsAuth,
    baseUrl: 'https://docs.googleapis.com/v1',
    title: Property.ShortText({
        displayName: 'Document Title',
        required: true
    }),
    body: Property.LongText({
        displayName: 'Document Content',
        required: true
    }),
    parentFolder: Property.Dropdown({
        displayName: "Parent Folder",
        required: false,
        refreshers: [],
        options: async ({ auth }) => {
          if (!auth) {
            return {
              disabled: true,
              options: [],
              placeholder: 'Please authenticate first'
            }
          }
          const authProp: OAuth2PropertyValue = auth as OAuth2PropertyValue;
          const folders = (await httpClient.sendRequest<{ files: { id: string, name: string }[] }>({
            method: HttpMethod.GET,
            url: `https://www.googleapis.com/drive/v3/files`,
            queryParams: {
              q: "mimeType='application/vnd.google-apps.folder'"
            },
            authentication: {
              type: AuthenticationType.BEARER_TOKEN,
              token: authProp['access_token'],
            }
          })).body.files;

          return {
            disabled: false,
            options: folders.map((sheet: { id: string, name: string }) => {
              return {
                label: sheet.name,
                value: sheet.id
              }
            })
          };
        }
    }),

    // Creates an empty document with the title provided
    createDocument: async (title: string, accessToken: string, parentFolder?: string) => {
        const createRequest = await httpClient.sendRequest({
            url: `${docsCommon.baseUrl}/documents`,
            method: HttpMethod.POST,
            authentication: {
                type: AuthenticationType.BEARER_TOKEN,
                token: accessToken,
            },
            body: {
                title: title,
                ...(parentFolder ? { 'parents': [parentFolder] } : {})
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
