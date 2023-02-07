import { AuthenticationType } from "../../../common/authentication/core/authentication-type";
import { httpClient } from "../../../common/http/core/http-client";
import { HttpMethod } from "../../../common/http/core/http-method";
import { HttpRequest } from "../../../common/http/core/http-request";
import { createAction } from "../../../framework/action/action";
import { Property } from "../../../framework/property";

export const googleDriveCeateNewFolder = createAction({
  name: 'add_contact',
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
    parentFolder: Property.ShortText({
      displayName: 'Parent folder',
      description: 'Id of the folder to create new folder inside',
      required: false,
    }),
  },
  async run(context) {
    const body: Record<string, string | string[] | undefined> = {
      'mimeType': "application/vnd.google-apps.folder",
      'name': context.propsValue.folderName,
    }

    if (context.propsValue?.parentFolder) {
      body['parents'] = [context.propsValue.parentFolder]
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
    console.debug("Meeting registration response", result)

    if (result.status == 200) {
      return result.body;
    } else {
      return result;
    }
  }
});