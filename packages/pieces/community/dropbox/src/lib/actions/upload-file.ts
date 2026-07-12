import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
  HttpMessageBody,
} from '@activepieces/pieces-common';
import { dropboxAuth } from '../auth';

const CHUNK_SIZE_BYTES = 8 * 1024 * 1024;

export const dropboxUploadFile = createAction({
  auth: dropboxAuth,
  name: 'upload_dropbox_file',
  description: 'Upload a file',
  audience: 'both',
  aiMetadata: { description: 'Uploads a file (provided as a URL or base64 file object) to the given Dropbox path in add mode. Use to store binary or arbitrary file content; prefer the create-text-file action when the source is plain text. Not idempotent: each call uploads, so repeating it can create autorenamed duplicates rather than overwriting.', idempotent: false },
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
      stream: true,
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
    const rawPath = context.propsValue.path;
    const commit = {
      autorename: context.propsValue.autorename,
      // Dropbox rejects paths without a leading / (or id:/ns: prefix) — and only at session finish, after the bytes are already uploaded
      path: /^(\/|id:|ns:)/.test(rawPath) ? rawPath : `/${rawPath}`,
      mode: 'add',
      mute: context.propsValue.mute,
      strict_conflict: context.propsValue.strict_conflict,
    };
    const token = context.auth.access_token;

    const stream = await context.propsValue.file.stream();
    const chunks = chunkStream({ stream });

    const first = await chunks.next();
    const firstChunk = first.done ? Buffer.alloc(0) : first.value;
    const second = await chunks.next();

    if (second.done) {
      return sendContentRequest({
        endpoint: 'files/upload',
        apiArg: commit,
        body: firstChunk,
        token,
      });
    }

    const session = await sendContentRequest<{ session_id: string }>({
      endpoint: 'files/upload_session/start',
      apiArg: { close: false },
      body: firstChunk,
      token,
    });
    let offset = firstChunk.length;
    let current = second.value;
    for (;;) {
      const next = await chunks.next();
      const cursor = { session_id: session.session_id, offset };
      if (next.done) {
        return sendContentRequest({
          endpoint: 'files/upload_session/finish',
          apiArg: { cursor, commit },
          body: current,
          token,
        });
      }
      await sendContentRequest({
        endpoint: 'files/upload_session/append_v2',
        apiArg: { cursor, close: false },
        body: current,
        token,
      });
      offset += current.length;
      current = next.value;
    }
  },
});

async function sendContentRequest<T extends HttpMessageBody>({ endpoint, apiArg, body, token }: { endpoint: string, apiArg: unknown, body: Buffer, token: string }): Promise<T> {
  const result = await httpClient.sendRequest<T>({
    method: HttpMethod.POST,
    url: `https://content.dropboxapi.com/2/${endpoint}`,
    body,
    headers: {
      // For information about Dropbox JSON encoding, see https://www.dropbox.com/developers/reference/json-encoding
      'Dropbox-API-Arg': JSON.stringify(apiArg).replace(/[\u007f-\uffff]/g, (c) => '\\u' + ('000' + c.charCodeAt(0).toString(16)).slice(-4)),
      'Content-Type': 'application/octet-stream',
    },
    authentication: {
      type: AuthenticationType.BEARER_TOKEN,
      token,
    },
  });
  return result.body;
}

async function* chunkStream({ stream }: { stream: AsyncIterable<Uint8Array> }): AsyncGenerator<Buffer, void, undefined> {
  let pending: Uint8Array[] = [];
  let pendingBytes = 0;
  let yielded = false;
  for await (const chunk of stream) {
    pending.push(chunk);
    pendingBytes += chunk.length;
    while (pendingBytes >= CHUNK_SIZE_BYTES) {
      const merged = Buffer.concat(pending);
      yield merged.subarray(0, CHUNK_SIZE_BYTES);
      yielded = true;
      pending = [merged.subarray(CHUNK_SIZE_BYTES)];
      pendingBytes = pending[0].length;
    }
  }
  // On an exact chunk-size multiple, pending is empty here — don't emit a stray
  // empty chunk that finish would upload at the wrong cursor. Only emit the tail
  // if it has bytes, or if nothing was ever yielded (empty input still needs one).
  if (pendingBytes > 0 || !yielded) {
    yield Buffer.concat(pending);
  }
}
