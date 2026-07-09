import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import {
  PieceAuth,
  Property,
  createAction,
  createPiece,
} from '@activepieces/pieces-framework';

const streamDownload = createAction({
  name: 'stream_download',
  displayName: 'Stream Download to File',
  description:
    'Downloads a URL as a stream and stores it via files.writeStream — bytes never buffer in memory.',
  props: {
    url: Property.ShortText({
      displayName: 'URL',
      description: 'A large file URL to download',
      required: true,
    }),
    fileName: Property.ShortText({
      displayName: 'File Name',
      required: true,
      defaultValue: 'download.bin',
    }),
  },
  async run(context) {
    const startedAt = Date.now();
    const stream = await httpClient.stream({
      method: HttpMethod.GET,
      url: context.propsValue.url,
    });
    const file = await context.files.writeStream({
      fileName: context.propsValue.fileName,
      stream,
    });
    return { file, durationMs: Date.now() - startedAt };
  },
});

const inspectFileRef = createAction({
  name: 'inspect_file_ref',
  displayName: 'Inspect File Reference',
  description:
    'Consumes a stream-enabled file input lazily (ApFileRef) and counts its bytes without buffering.',
  props: {
    file: Property.File({
      displayName: 'File',
      required: true,
      stream: true,
    }),
  },
  async run(context) {
    const ref = context.propsValue.file;
    const stream = await ref.stream();
    let bytes = 0;
    for await (const chunk of stream) {
      bytes += (chunk as Uint8Array).length;
    }
    return {
      filename: ref.filename,
      mimetype: ref.mimetype,
      knownSize: ref.size,
      streamedBytes: bytes,
    };
  },
});

export const streamTest = createPiece({
  displayName: 'Stream Test',
  description: 'Dev-only piece for manually testing large-file streaming.',
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/activepieces.png',
  authors: [],
  actions: [streamDownload, inspectFileRef],
  triggers: [],
});
