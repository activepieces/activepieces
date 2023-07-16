import { Property, OAuth2PropertyValue } from "@activepieces/pieces-framework";
import { httpClient, HttpMethod, AuthenticationType, HttpRequest } from "@activepieces/pieces-common";
import FormData from "form-data";

export const docsCommon = {
    googleDriveUploadBaseUrl: 'https://www.googleapis.com/upload/drive/v3',
    googleDocsBaseUrl: 'https://docs.googleapis.com/v1',
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
            url: 'https://www.googleapis.com/drive/v3/files',
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
        const meta = {
            'mimeType': "application/vnd.google-apps.document",
            'name': title,
            ...(parentFolder ? { 'parents': [parentFolder] } : {})
        }

        const metaBuffer = Buffer.from(JSON.stringify(meta), 'utf-8');

        const form = new FormData()
        form.append("Metadata", metaBuffer, { contentType: 'application/json' });

        const result = await httpClient.sendRequest({
            method: HttpMethod.POST,
            url: `${docsCommon.googleDriveUploadBaseUrl}/files?uploadType=multipart`,
            body: form,
            headers: {
                ...form.getHeaders(),
            },
            authentication: {
                type: AuthenticationType.BEARER_TOKEN,
                token: accessToken,
            }
        })

        console.debug("File creation response", result)
        return result.body;
    },

    // Writes provided content to the end of an existing document
    writeToDocument: async (documentId: number, body: string, accessToken: string) => {
        const writeRequest = await httpClient.sendRequest({
            url: `${docsCommon.googleDocsBaseUrl}/documents/${documentId}:batchUpdate`,
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
