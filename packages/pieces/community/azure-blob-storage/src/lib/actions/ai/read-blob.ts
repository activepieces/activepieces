import { PassThrough } from 'node:stream';
import { createAction, Property } from '@activepieces/pieces-framework';
import { azureBlobStorageAuth } from '../../auth';
import { azureBlobAiProps, azureBlobCommon } from '../../common/client';
import { aiReadBlobOutputSchema } from '../../output-schemas';

function isTextContentType(contentType: string | null): boolean {
  if (!contentType) {
    return false;
  }
  const type = contentType.toLowerCase();
  return type.startsWith('text/') || TEXT_TYPE_MARKERS.some((marker) => type.includes(marker));
}

const TEXT_TYPE_MARKERS = ['json', 'xml', 'csv', 'yaml', 'javascript', 'markdown', 'x-www-form-urlencoded'];
const DEFAULT_MAX_BYTES = 1048576;
const MAX_TEXT_BYTES = 10485760;

export const aiReadBlob = createAction({
  auth: azureBlobStorageAuth,
  name: 'azure_blob_read_blob',
  displayName: 'Read Blob',
  description: 'Downloads a blob as a file and returns its text when it is a small text file.',
  audience: 'ai',
  classification: 'READ',
  outputSchema: aiReadBlobOutputSchema,
  aiMetadata: {
    description:
      'Downloads one blob and returns it as a stored file for later steps. When the content type is textual (text/*, JSON, XML, CSV, YAML) and the blob is at most maxBytes (default 1 MB, max 10 MB), the UTF-8 text is also returned in "text"; otherwise text is null and truncated is true for text blobs that were too large. Use Get Blob Properties first to check size without downloading. Read-only.',
    idempotent: true,
  },
  props: {
    container: azureBlobAiProps.containerName(),
    blobName: azureBlobAiProps.blobName(),
    maxBytes: Property.Number({
      displayName: 'Max Text Bytes',
      description: 'Largest blob (in bytes) whose text is returned inline. Default 1048576 (1 MB), max 10485760.',
      required: false,
      defaultValue: DEFAULT_MAX_BYTES,
    }),
  },
  async run(context) {
    const { container, blobName, maxBytes } = context.propsValue;
    const limit =
      maxBytes === undefined || maxBytes === null
        ? DEFAULT_MAX_BYTES
        : Math.floor(maxBytes);
    if (!Number.isFinite(limit) || limit < 0 || limit > MAX_TEXT_BYTES) {
      throw new Error(`Max Text Bytes must be between 0 and ${MAX_TEXT_BYTES}.`);
    }
    const client = await azureBlobCommon.getServiceClient({
      connectionString: context.auth.props.connectionString,
    });
    const blobClient = client.getContainerClient(container).getBlobClient(blobName);
    const properties = await azureBlobCommon.callAzure({
      operation: 'read blob',
      isWrite: false,
      request: () => blobClient.getProperties(),
      notFoundMessage: `blob "${blobName}" not found in container "${container}".`,
    });
    const contentType = properties.contentType ?? null;
    const size = properties.contentLength ?? null;
    const isText = isTextContentType(contentType);
    const inline = isText && size !== null && size <= limit;
    const fileName = blobName.split('/').pop() || 'downloaded_blob';
    const conditions = properties.etag ? { ifMatch: properties.etag } : undefined;

    let text: string | null = null;
    let file: string;
    if (inline) {
      const buffer = await azureBlobCommon.callAzure({
        operation: 'read blob',
        isWrite: false,
        request: () => blobClient.downloadToBuffer(0, undefined, { conditions }),
      });
      text = buffer.toString('utf8');
      file = await context.files.write({ fileName, data: buffer });
    } else {
      const response = await azureBlobCommon.callAzure({
        operation: 'read blob',
        isWrite: false,
        request: () => blobClient.download(0, undefined, { conditions }),
      });
      if (!response.readableStreamBody) {
        throw new Error(`Azure Blob read blob failed: "${blobName}" returned no content.`);
      }
      file = await context.files.write({
        fileName,
        data: response.readableStreamBody.pipe(new PassThrough()),
      });
    }

    return {
      container,
      blobName,
      contentType,
      size,
      lastModified: azureBlobCommon.toIso(properties.lastModified),
      etag: properties.etag ?? null,
      text,
      truncated: isText && !inline,
      file,
    };
  },
});
