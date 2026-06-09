import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
} from '@activepieces/pieces-common';
import { dropboxAuth } from '../auth';

export const dropboxDownloadFile = createAction({
  auth: dropboxAuth,
  name: 'downloadFile',
  displayName: 'Download File',
  description: 'Download a File from Dropbox',
  audience: 'both',
  aiMetadata: { description: 'Downloads the file at the given Dropbox path and returns it as a file object for use by later steps. Use to retrieve file contents into a flow. Read-only on Dropbox; repeating the call with the same path is safe and yields the same file.', idempotent: true },
  props: {
    path: Property.ShortText({
      displayName: "Path",
      description: "The path of the file (e.g. /folder1/file.txt)",
      required: true
    })
  },
  async run(context) {
    // Capture file name, if unsuccesfull default to output.pdf
    const fileName = (context.propsValue.path.match(/[^/]+$/) ?? ['output.pdf'])[0]

     // For information about Dropbox JSON encoding, see https://www.dropbox.com/developers/reference/json-encoding
    const dropboxApiArg = JSON.stringify({path:context.propsValue.path}).replace(/[\u007f-\uffff]/g, (c) => '\\u'+('000'+c.charCodeAt(0).toString(16)).slice(-4));

    const result = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `https://content.dropboxapi.com/2/files/download`,
      headers: {
        'Content-Type': 'application/octet-stream',
        'Dropbox-API-Arg': dropboxApiArg
      },
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.access_token,
      },
      responseType:'arraybuffer'
    });

    return {
      file: await context.files.write({
        fileName: fileName,
        data: Buffer.from(result.body)
      })
    }
  },
});
