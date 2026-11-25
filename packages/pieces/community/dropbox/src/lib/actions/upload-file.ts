import { Readable } from 'node:stream';
import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
  streamUtils,
} from '@activepieces/pieces-common';
import { dropboxAuth } from '../auth';
import { dropboxCommon } from '../common';
import { uploadedFileOutputSchema } from '../output-schemas';

const CONTENT_API_URL = 'https://content.dropboxapi.com/2';
const SINGLE_REQUEST_LIMIT = 150 * 1024 * 1024;
const CHUNK_SIZE = 8 * 1024 * 1024;

export const dropboxUploadFile = createAction({
  auth: dropboxAuth,
  name: 'upload_dropbox_file',
  classification: 'WRITE',
  description: 'Upload a file to Dropbox',
  audience: 'both',
  aiMetadata: { description: 'Uploads a file (provided as a URL or base64 file object) to the given Dropbox path in add mode. Files over 150 MB are uploaded in chunks automatically. Use to store binary or arbitrary file content; prefer the create-text-file action when the source is plain text. Not idempotent: each call uploads, so repeating it can create autorenamed duplicates rather than overwriting.', idempotent: false },
  displayName: 'Upload File',
  outputSchema: uploadedFileOutputSchema,
  propertyGroups: [
    { key: 'destination', display: 'section', label: 'Destination', icon: 'file', props: ['path'] },
    { key: 'content', display: 'section', label: 'Content', icon: 'paperclip', props: ['file'] },
  ],
  props: {
    path: Property.ShortText({
      displayName: 'Path',
      description: 'Path to save to, including the file name.',
      placeholder: '/Uploads/report.pdf',
      required: true,
    }),
    file: Property.File({
      displayName: 'File',
      description: 'A file from an earlier step, or a public URL.',
      required: true,
      streaming: true,
    }),
    autorename: Property.Checkbox({
      displayName: 'Auto Rename',
      description: 'If the name is taken, save under a new name instead of failing.',
      defaultValue: false,
      required: false,
      advanced: true,
    }),
    mute: Property.Checkbox({
      displayName: 'Mute Notifications',
      description: "Don't notify the account's Dropbox apps about this change.",
      required: false,
      advanced: true,
    }),
    strict_conflict: Property.Checkbox({
      displayName: 'Strict Conflict',
      description: 'Fail even when a file with identical contents is already there.',
      required: false,
      advanced: true,
    }),
  },
  async run(context) {
    const { body, size } = streamUtils.toStreamingBody(context.propsValue.file);
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
    if (size != null && size <= SINGLE_REQUEST_LIMIT) {
      return await sendToDropbox({
        endpoint: 'files/upload',
        apiArg: commit,
        body,
        contentLength: size,
        token,
      });
    }

    return await uploadInSession({ body, commit, token });
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
      'Dropbox-API-Arg': dropboxCommon.encodeApiArg(apiArg),
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
