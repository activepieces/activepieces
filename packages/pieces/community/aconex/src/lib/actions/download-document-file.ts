import { Readable } from 'node:stream';
import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { getAccessToken, sendAconex, ACONEX_API_BASE, assertProjectsPath, currentFileByteCap } from '../client';
import { aconexAuth } from '../auth';
import { assertAuthProps, readAuth } from '../auth-props';
import { AconexError } from '../errors';
import { assertNumericId } from '../input';
import { logEvent } from '../log';
import { projectIdProp } from '../props';

// responseType 'stream' is supported: FetchHttpClient.parseResponseBody returns a Node
// Readable via Readable.fromWeb. See packages/pieces/common/src/lib/http/core/fetch-http-client.ts.
// The byte cap counts that stream. It does not trust Content-Length.

export const downloadDocumentFileAction = createAction({
  auth: aconexAuth,
  name: 'download_document_file',
  displayName: 'Download Document File',
  description:
    'Download the primary file for one document version. Marked-up files come back as PDF. Files over 500 MB are not saved. Secondary renditions are not downloaded.',
  classification: 'READ',
  props: {
    projectId: projectIdProp,
    documentId: Property.ShortText({
      displayName: 'Document ID',
      description: 'Numeric document version id.',
      required: true,
    }),
    markedup: Property.Checkbox({
      displayName: 'Marked up',
      description: 'Download the marked-up PDF instead of the original file.',
      required: false,
      defaultValue: false,
    }),
    sizeForceFetch: Property.Checkbox({
      displayName: 'Force fetch when size is unknown',
      description: 'Send sizeForceFetch=true. Leave off unless Aconex requires it for this file.',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const auth = assertAuthProps(readAuth(context.auth));
    const projectId = assertNumericId(context.propsValue.projectId, 'Project');
    const documentId = assertNumericId(context.propsValue.documentId, 'Document');
    const markedup = context.propsValue.markedup === true;
    const path = markedup
      ? `/projects/${projectId}/register/${documentId}/markedup`
      : `/projects/${projectId}/register/${documentId}`;
    assertProjectsPath(path);
    const token = await getAccessToken(auth);
    const queryParams = context.propsValue.sizeForceFetch === true ? { sizeForceFetch: 'true' } : undefined;
    const response = await sendAconex({
      method: HttpMethod.GET,
      url: `${ACONEX_API_BASE}${path}`,
      queryParams,
      headers: { Authorization: `Bearer ${token}` },
      responseType: 'stream',
      timeout: 120_000,
      followRedirects: true,
    });
    const bytes = await readAtMost(response.body, currentFileByteCap());
    const fileName = safeBaseName(fileNameFromContentDisposition(response.headers) ?? `${documentId}.bin`);
    logEvent('aconex.download', { documentId, bytes: bytes.length, fileName, markedup });
    return {
      documentId,
      fileName,
      bytes: bytes.length,
      file: await context.files.write({ fileName, data: bytes }),
    };
  },
});

async function readAtMost(body: unknown, maxBytes: number): Promise<Buffer> {
  if (!isReadable(body)) {
    throw new AconexError('DOWNLOAD_FAILED', 'Aconex did not return a file stream.');
  }
  const chunks: Buffer[] = [];
  let total = 0;
  try {
    for await (const chunk of body) {
      const buf = toBuffer(chunk);
      total += buf.length;
      if (total > maxBytes) {
        body.destroy();
        throw new AconexError('FILE_TOO_LARGE', 'The document is larger than 500 MB and was not saved.');
      }
      chunks.push(buf);
    }
  } catch (error) {
    if (!body.destroyed) {
      body.destroy();
    }
    if (error instanceof AconexError) {
      throw error;
    }
    throw new AconexError('DOWNLOAD_FAILED', 'The document download failed before the file was saved.');
  }
  return Buffer.concat(chunks);
}

function isReadable(body: unknown): body is Readable {
  return !!body && typeof body === 'object' && Symbol.asyncIterator in body && typeof (body as Readable).destroy === 'function';
}

function toBuffer(chunk: unknown): Buffer {
  if (Buffer.isBuffer(chunk)) {
    return chunk;
  }
  if (typeof chunk === 'string') {
    return Buffer.from(chunk);
  }
  if (chunk instanceof Uint8Array) {
    return Buffer.from(chunk);
  }
  throw new AconexError('DOWNLOAD_FAILED', 'Aconex returned a file chunk that was not bytes.');
}

function fileNameFromContentDisposition(
  headers: Record<string, string | string[] | undefined>,
): string | undefined {
  const raw = headers['content-disposition'] ?? headers['Content-Disposition'];
  const header = Array.isArray(raw) ? raw.join(',') : raw;
  if (!header) {
    return undefined;
  }
  const star = /filename\*\s*=\s*("?)([^";]+)\1/i.exec(header);
  if (star?.[2]) {
    let value = star[2].trim();
    const encoded = /^(?:UTF-8|utf-8)''([\s\S]*)$/.exec(value);
    if (encoded?.[1]) {
      try {
        value = decodeURIComponent(encoded[1]);
      } catch {
        value = encoded[1];
      }
    }
    return value;
  }
  const plain = /filename\s*=\s*("?)([^";]+)\1/i.exec(header);
  return plain?.[2]?.trim();
}

export function safeBaseName(name: string): string {
  const base = name.split(/[/\\]/).pop() ?? '';
  const cleaned = base.replace(/;/g, '').replace(/[^A-Za-z0-9._ -]/g, '_').trim();
  return cleaned.length > 0 ? cleaned : 'file.bin';
}
