import { createAction, Property, OAuth2PropertyValue } from "@activepieces/pieces-framework";
import { httpClient, HttpMethod, AuthenticationType } from "@activepieces/pieces-common";
import FormData from "form-data";
import { googleDriveAuth } from "../../";

export const googleDriveCreateNewTextFile = createAction({
  auth: googleDriveAuth,
    name: 'create_new_gdrive_file',
    description: 'Create a new text file in your Google Drive from text',
    displayName: 'Create new file',
    props: {
      fileName: Property.ShortText({
        displayName: 'File name',
        description: 'The name of the new text file',
        required: true,
      }),
      text: Property.LongText({
        displayName: 'Text',
        description: 'The text content to add to file',
        required: true,
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
              token: authProp!['access_token'],
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
    sampleData: {
      "kind": "drive#file",
      "id": "1VjCR4-747AvKH7KeQ6GclFpCnu_41ZDX",
      "name": "text.txt",
      "mimeType": "plain/text"
    },
    async run(context) {
      const meta = {
        'mimeType': "plain/text",
        'name': context.propsValue.fileName,
        ...(context.propsValue.parentFolder ? { 'parents': [context.propsValue.parentFolder] } : {})
      }

      const metaBuffer = Buffer.from(JSON.stringify(meta), 'utf-8');
      const textBuffer = Buffer.from(context.propsValue.text!, 'utf-8');

      const form = new FormData()
      form.append("Metadata", metaBuffer, { contentType: 'application/json' });
      form.append("Media", textBuffer, { contentType: 'plain/text' });

      const result = await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: `https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart`,
        body: form,
        headers: {
          ...form.getHeaders(),
        },
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: context.auth.access_token,
        }
      })

      console.debug("File creation response", result)
      return result.body;
    }
});
