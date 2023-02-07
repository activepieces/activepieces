import { AuthenticationType } from "../../../common/authentication/core/authentication-type";
import { httpClient } from "../../../common/http/core/http-client";
import { HttpMessageBody } from "../../../common/http/core/http-message-body";
import { HttpMethod } from "../../../common/http/core/http-method";
import { HttpRequest } from "../../../common/http/core/http-request";
import { createAction } from "../../../framework/action/action";
import { Property } from "../../../framework/property";

export const googleDriveCreateNewTextFile = createAction({
  name: 'create_new_gdrive_file',
  description: 'Create a new text file in your Google Drive from text',
  displayName: 'Create new file',
  props: {
    authentication: Property.OAuth2({
      description: "",
      displayName: 'Authentication',
      authUrl: "https://accounts.google.com/o/oauth2/auth",
      tokenUrl: "https://oauth2.googleapis.com/token",
      required: true,
      scope: ["https://www.googleapis.com/auth/drive"]
    }),
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
    parentFolder: Property.ShortText({
      displayName: 'Parent folder',
      description: 'Id of the folder to create new folder inside',
      required: false,
    }),
  },
  async run(context) {
    if (context.propsValue.text) {

      const meta = {
        'mimeType': "plain/text",
        'name': context.propsValue.fileName, 
        ...(context.propsValue.parentFolder ? {'parents': [context.propsValue.parentFolder]}: {})
      }

      const formData = new FormData()
      formData.append("Metadata", new Blob([JSON.stringify(meta)], {type: 'application/json'}))
      formData.append("Media", new Blob([context.propsValue.text], {type: 'plain/text'}))
      
      const request: HttpRequest<HttpMessageBody> = {
        method: HttpMethod.POST,
        url: `https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart`,
        body: formData,
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: context.propsValue['authentication']!['access_token'],
        }
      }
  
      const result = await httpClient.sendRequest(request)
      console.debug("File creation response", result)
  
      if (result.status == 200) {
        return result.body;
      } else {
        return result;
      }
    }

  }
});