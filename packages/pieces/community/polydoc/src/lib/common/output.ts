import { defaultFilename } from './build-request-body';
import type { PolyDocResponse } from './client';
import type { PolyDocOperation } from './types';

interface FilesWriter {
  write(params: { fileName: string; data: Buffer }): Promise<string>;
}

interface ShapeOutputParams {
  response: PolyDocResponse;
  isBinary: boolean;
  files: FilesWriter;
  operation: PolyDocOperation;
  filename?: string;
  imageType?: string;
}

/**
 * Turn a PolyDoc API response into an action result. Binary deliveries are
 * written to a file (returning a file handle plus metadata); cloud-storage,
 * webhook, and screenshot-base64 deliveries return the API's JSON as-is.
 */
export async function shapeOutput(params: ShapeOutputParams): Promise<unknown> {
  const { response, isBinary, files, operation, filename, imageType } = params;

  if (!isBinary) {
    return response.body ?? { success: true };
  }

  const contentType = (headerValue(response.headers['content-type']) ?? 'application/octet-stream')
    .split(';')[0]
    .trim();
  const buffer = toBuffer(response.body);
  const fileName = filename || defaultFilename(operation, imageType);
  const file = await files.write({ fileName, data: buffer });

  return {
    success: true,
    file,
    fileName,
    contentType,
    sizeBytes: buffer.length,
    conversionId: headerValue(response.headers['x-conversion-id']),
    creditUsed: headerValue(response.headers['x-credit-used']),
  };
}

function headerValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function toBuffer(body: unknown): Buffer {
  if (Buffer.isBuffer(body)) {
    return body;
  }
  if (body instanceof ArrayBuffer) {
    return Buffer.from(body);
  }
  if (ArrayBuffer.isView(body)) {
    return Buffer.from(body.buffer, body.byteOffset, body.byteLength);
  }
  if (typeof body === 'string') {
    return Buffer.from(body, 'binary');
  }
  return Buffer.alloc(0);
}
