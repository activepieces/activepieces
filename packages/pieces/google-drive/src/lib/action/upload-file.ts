import { createAction, Property, OAuth2PropertyValue } from "@activepieces/pieces-framework";
import { httpClient, HttpMethod, AuthenticationType } from "@activepieces/pieces-common";
import FormData from "form-data";
import { googleDriveAuth } from "../../";
import mime from 'mime-types';

export const googleDriveUploadFile = createAction({
  auth: googleDriveAuth,
    name: 'upload_gdrive_file',
    description: 'Upload a file in your Google Drive',
    displayName: 'Upload file',
    props: {
      fileName: Property.ShortText({
        displayName: 'File name',
        description: 'The name of the file',
        required: true,
      }),
      file: Property.File({
        displayName: "File",
        description: "The file URL or base64 to upload",
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
    async run(context) {
      const fileData = context.propsValue.file;
      const mimeType = mime.lookup(fileData.extension ? fileData.extension : '');

      const meta = {
        'mimeType': mimeType,
        'name': context.propsValue.fileName,
        ...(context.propsValue.parentFolder ? { 'parents': [context.propsValue.parentFolder] } : {})
      }

      const metaBuffer = Buffer.from(JSON.stringify(meta), 'utf-8');
      const fileBuffer = Buffer.from(fileData.base64, 'base64');

      const form = new FormData()
      form.append("Metadata", metaBuffer, { contentType: 'application/json' });
      form.append("Media", fileBuffer);

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

      console.debug("File upload response", result)
      return result.body;
    }
});
