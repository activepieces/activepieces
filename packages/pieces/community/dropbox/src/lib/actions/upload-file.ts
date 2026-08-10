import { Readable } from 'node:stream';
import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
  streamUtils,
} from '@activepieces/pieces-common';
import { dropboxAuth } from '../auth';

const CONTENT_API_URL = 'https://content.dropboxapi.com/2';
const SINGLE_REQUEST_LIMIT = 150 * 1024 * 1024;
const CHUNK_SIZE = 8 * 1024 * 1024;

export const dropboxUploadFile = createAction({
  auth: dropboxAuth,
  name: 'upload_dropbox_file',
  description: 'Upload a file',
  audience: 'both',
  aiMetadata: { description: 'Uploads a file (provided as a URL or base64 file object) to the given Dropbox path in add mode. Files over 150 MB are uploaded in chunks automatically. Use to store binary or arbitrary file content; prefer the create-text-file action when the source is plain text. Not idempotent: each call uploads, so repeating it can create autorenamed duplicates rather than overwriting.', idempotent: false },
  displayName: 'Upload file',
  props: {
    path: Property.ShortText({
      displayName: 'Path',
      description:
        'The path where the file should be saved (e.g. /folder1/file.txt)',
      required: true,
    }),
    file: Property.File({
      displayName: 'File',
      description: 'The file URL or base64 to upload',
      required: true,
      streaming: true,
    }),
    autorename: Property.Checkbox({
      displayName: 'Auto Rename',
      description:
        "If there's a conflict, as determined by mode, have the Dropbox server try to autorename the file to avoid conflict.",
      defaultValue: false,
      required: false,
    }),
    mute: Property.Checkbox({
      displayName: 'Mute',
      description:
        "Normally, users are made aware of any file modifications in their Dropbox account via notifications in the client software. If true, this tells the clients that this modification shouldn't result in a user notification.",
      required: false,
    }),
    strict_conflict: Property.Checkbox({
      displayName: 'Strict conflict',
      description:
        'Be more strict about how each WriteMode detects conflict. For example, always return a conflict error when mode = WriteMode.update and the given "rev" doesn\'t match the existing file\'s "rev", even if the existing file has been deleted.',
      required: false,
    }),
  },
  async run(context) {
    const fileData = context.propsValue.file;
    const token = context.auth.access_token;
    const commit = {
      autorename: context.propsValue.autorename,
      path: context.propsValue.path,
      mode: 'add',
      mute: context.propsValue.mute,
      strict_conflict: context.propsValue.strict_conflict,
    };

    // A known size within the single-request cap lets us stream the body straight
    // through with an explicit Content-Length. Larger files, and sources that don't
    // report a size, go through an upload session so nothing is buffered whole.
    if (fileData.size != null && fileData.size <= SINGLE_REQUEST_LIMIT) {
      return await sendToDropbox({
        endpoint: 'files/upload',
        apiArg: commit,
        body: fileData.body,
        contentLength: fileData.size,
        token,
      });
    }

    return await uploadInSession({ body: fileData.body, commit, token });
  },
});

async function uploadInSession({
  body,
  commit,
  token,
}: {
  body: Readable;
  commit: Record<string, unknown>;
  token: string;
}) {
  const chunks = streamUtils.readChunks({ readable: body, chunkSize: CHUNK_SIZE });
  const firstChunk = await chunks.next();

  const { session_id } = await sendToDropbox<{ session_id: string }>({
    endpoint: 'files/upload_session/start',
    apiArg: { close: false },
    body: firstChunk.done ? Buffer.alloc(0) : firstChunk.value,
    token,
  });

  let offset = firstChunk.done ? 0 : firstChunk.value.length;
  for await (const chunk of chunks) {
    await sendToDropbox({
      endpoint: 'files/upload_session/append_v2',
      apiArg: { cursor: { session_id, offset }, close: false },
      body: chunk,
      token,
    });
    offset += chunk.length;
  }

  return await sendToDropbox({
    endpoint: 'files/upload_session/finish',
    apiArg: { cursor: { session_id, offset }, commit },
    body: Buffer.alloc(0),
    token,
  });
}

async function sendToDropbox<ResponseBody>({
  endpoint,
  apiArg,
  body,
  contentLength,
  token,
}: {
  endpoint: string;
  apiArg: unknown;
  body: Buffer | Readable;
  contentLength?: number;
  token: string;
}): Promise<ResponseBody> {
  const response = await httpClient.sendRequest<ResponseBody>({
    method: HttpMethod.POST,
    url: `${CONTENT_API_URL}/${endpoint}`,
    body,
    headers: {
      'Dropbox-API-Arg': encodeApiArg(apiArg),
      'Content-Type': 'application/octet-stream',
      'Content-Length': contentLength != null ? String(contentLength) : undefined,
    },
    authentication: {
      type: AuthenticationType.BEARER_TOKEN,
      token,
    },
  });

  return response.body;
}

// For information about Dropbox JSON encoding, see https://www.dropbox.com/developers/reference/json-encoding
function encodeApiArg(value: unknown): string {
  return JSON.stringify(value).replace(/[\u007f-\uffff]/g, (character) => '\\u'+('000'+character.charCodeAt(0).toString(16)).slice(-4));
}
