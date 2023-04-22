import { createAction, Property, OAuth2PropertyValue } from "@activepieces/pieces-framework";
import { httpClient, HttpMethod, AuthenticationType, HttpRequest } from "@activepieces/pieces-common";

export const googleDriveCreateNewFolder = createAction({
  name: 'create_new_gdrive_folder',
  description: 'Create a new empty folder in your Google Drive',
  displayName: 'Create new folder',
  props: {
    authentication: Property.OAuth2({
      description: "",
      displayName: 'Authentication',
      authUrl: "https://accounts.google.com/o/oauth2/auth",
      tokenUrl: "https://oauth2.googleapis.com/token",
      required: true,
      scope: ["https://www.googleapis.com/auth/drive"]
    }),
    folderName: Property.ShortText({
      displayName: 'Folder name',
      description: 'The name of the new folder',
      required: true,
    }),
    parentFolder: Property.Dropdown({
      displayName: "Parent Folder",
      required: false,
      refreshers: ['authentication'],
      options: async (propsValue) => {
        if (!propsValue['authentication']) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Please authenticate first'
          }
        }
        const authProp: OAuth2PropertyValue = propsValue['authentication'] as OAuth2PropertyValue;
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
  sampleData: {
    "kind": "drive#file",
    "id": "1zBGDdjasE4A63269CXhqOvAe3odTsplF",
    "name": "New Folder",
    "mimeType": "application/vnd.google-apps.folder"
  },
  async run(context) {
    const body: Record<string, (string | string[] | undefined)> = {
      'mimeType': "application/vnd.google-apps.folder",
      'name': context.propsValue.folderName,
      ...(context.propsValue.parentFolder ? { 'parents': [context.propsValue.parentFolder] } : {})
    }

    const request: HttpRequest<Record<string, unknown>> = {
      method: HttpMethod.POST,
      url: `https://www.googleapis.com/drive/v3/files`,
      body: body,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.propsValue['authentication']!['access_token'],
      }
    }

    const result = await httpClient.sendRequest(request)
    console.debug("Folder creation response", result)

    if (result.status == 200) {
      return result.body;
    } else {
      return result;
    }
  }
});
