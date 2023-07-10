import { createAction } from "@activepieces/pieces-framework";
import { docsCommon } from "../common";
import { googleDocsAuth } from "../..";

export const createDocument = createAction({
    auth: googleDocsAuth,
        name: 'create_document',
        description: 'Create a document on Google Docs',
        displayName: 'Create Document',
        props: {
            title: docsCommon.title,
            body: docsCommon.body,
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
        },
        async run(context) {
            const document = await docsCommon.createDocument(context.propsValue.title, context.auth.access_token, context.propsValue.parentFolder);
            const response = await docsCommon.writeToDocument(document.documentId, context.propsValue.body, context.auth.access_token);

            return response;
        }
});
