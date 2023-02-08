import { AuthenticationType } from "../../../common/authentication/core/authentication-type";
import { httpClient } from "../../../common/http/core/http-client";;
import { HttpMethod } from "../../../common/http/core/http-method";
import { createAction } from "../../../framework/action/action";
import { Property } from "../../../framework/property";

import FormData from "form-data";

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
        token: context.propsValue['authentication']!['access_token'],
      }
    })

    console.debug("File creation response", result)
    return result.body;
  }
});