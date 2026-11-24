import { createAction, Property } from '@activepieces/pieces-framework';
import { azureBlobStorageAuth } from '../../auth';
import { azureBlobAiProps, azureBlobCommon } from '../../common/client';
import { aiWriteBlobOutputSchema } from '../../output-schemas';

function readFileData(file: unknown): { data: Buffer; extension: string | null; filename: string | null } | null {
  if (typeof file !== 'object' || file === null || !('data' in file)) {
    return null;
  }
  const data = Reflect.get(file, 'data');
  if (!Buffer.isBuffer(data)) {
    return null;
  }
  const extension = 'extension' in file ? Reflect.get(file, 'extension') : null;
  const filename = 'filename' in file ? Reflect.get(file, 'filename') : null;
  return {
    data,
    extension: typeof extension === 'string' ? extension : null,
    filename: typeof filename === 'string' ? filename : null,
  };
}

export const aiUploadBlob = createAction({
  auth: azureBlobStorageAuth,
  name: 'azure_blob_upload_blob',
  displayName: 'Upload Blob',
  description: 'Uploads text or a file as a block blob.',
  audience: 'ai',
  classification: 'WRITE',
  outputSchema: aiWriteBlobOutputSchema,
  aiMetadata: {
    description:
      'Uploads a block blob to a container from either text content or a file (give exactly one). Optionally sets the content type, custom metadata (letters, digits, underscores in keys) and up to 10 tags. With overwrite "yes" (default) an existing blob of the same name is replaced; with "no" the call fails with BlobAlreadyExists instead. Returns the ETag, last-modified time, version id and URL. Use Set Blob Tags or Set Blob Metadata to change an existing blob without re-uploading. Not idempotent: each call writes a new version and ETag.',
    idempotent: false,
  },
  props: {
    container: azureBlobAiProps.containerName(),
    blobName: azureBlobAiProps.blobName(),
    content: Property.LongText({
      displayName: 'Text Content',
      description: 'Text to store as the blob, encoded as UTF-8. Leave empty when uploading a file.',
      required: false,
    }),
    file: Property.File({
      displayName: 'File',
      description: 'A file to store as the blob. Leave empty when sending text content.',
      required: false,
    }),
    contentType: Property.ShortText({
      displayName: 'Content Type',
      description: 'MIME type, e.g. "application/json". Defaults to "text/plain; charset=utf-8" for text; for files it is derived from the blob or file name extension (application/octet-stream when unknown).',
      required: false,
    }),
    metadata: Property.Object({
      displayName: 'Metadata',
      description: 'Custom metadata key/value pairs.',
      required: false,
    }),
    tags: Property.Object({
      displayName: 'Tags',
      description: 'Up to 10 tag key/value pairs, searchable with Find Blobs by Tags.',
      required: false,
    }),
    overwrite: Property.StaticDropdown<string>({
      displayName: 'Overwrite',
      description: 'Whether to replace a blob that already exists with this name.',
      required: false,
      defaultValue: 'yes',
      options: {
        options: [
          { label: 'Yes', value: 'yes' },
          { label: 'No', value: 'no' },
        ],
      },
    }),
  },
  async run(context) {
    const { container, blobName, content, file, contentType, metadata, tags, overwrite } =
      context.propsValue;
    const fileData = readFileData(file);
    const hasText = typeof content === 'string' && content !== '';
    if (hasText === (fileData !== null)) {
      throw new Error('Provide exactly one of Text Content or File.');
    }
    const validTags = azureBlobCommon.validateTags({ tags });
    const validMetadata = azureBlobCommon.validateMetadata({ metadata });
    const body = fileData ? fileData.data : Buffer.from(content ?? '', 'utf8');
    const type =
      azureBlobCommon.emptyToUndefined(contentType) ??
      (fileData
        ? azureBlobCommon.contentTypeFromName({
            names: [blobName, fileData.filename, fileData.extension ? `.${fileData.extension}` : null],
          })
        : 'text/plain; charset=utf-8');
    const client = await azureBlobCommon.getServiceClient({
      connectionString: context.auth.props.connectionString,
    });
    const blobClient = client.getContainerClient(container).getBlockBlobClient(blobName);
    const response = await azureBlobCommon.callAzure({
      operation: 'upload blob',
      isWrite: true,
      request: () =>
        blobClient.uploadData(body, {
          blobHTTPHeaders: { blobContentType: type },
          metadata: validMetadata,
          tags: Object.keys(validTags).length > 0 ? validTags : undefined,
          conditions: overwrite === 'no' ? { ifNoneMatch: '*' } : undefined,
        }),
    });
    return {
      container,
      blobName,
      etag: response.etag ?? null,
      lastModified: azureBlobCommon.toIso(response.lastModified),
      versionId: response.versionId ?? null,
      url: azureBlobCommon.stripUrlSecrets(blobClient.url),
    };
  },
});
