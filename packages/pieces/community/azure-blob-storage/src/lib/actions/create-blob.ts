import { createAction, Property } from '@activepieces/pieces-framework';
import { streamUtils } from '@activepieces/pieces-common';
import { azureBlobStorageAuth } from '../auth';
import { containerProp } from '../common';
import { azureBlobCommon } from '../common/client';
import { createBlobOutputSchema } from '../output-schemas';

export const createBlob = createAction({
  auth: azureBlobStorageAuth,
  name: 'createBlob',
  classification: 'WRITE',
  displayName: 'Create Blob',
  description: 'Creates a new Blob in the specified location',
  audience: 'human',
  outputSchema: createBlobOutputSchema,
  aiMetadata: { description: 'Uploads file data as a blob to the given container under the specified blob name, optionally attaching tags. Use to store or update a file in Azure Blob Storage. Idempotent on the blob name: re-uploading to the same name overwrites the existing blob rather than creating duplicates.', idempotent: true },
  props: {
    container: containerProp,
    blobName: Property.ShortText({
      displayName: 'Blob Name',
      description: 'The name of the blob to create',
      required: true,
    }),
    file: Property.File({
      displayName: 'File',
      description: 'The file to upload as a blob',
      required: true,
      streaming: true,
    }),
    tags: Property.Object({
      displayName: 'Tags',
      description: 'Optional tags to associate with the blob (up to 10 text key/value pairs)',
      required: false,
    }),
  },
  async run(context) {
    const { container, blobName, file, tags } = context.propsValue;
    const validTags = azureBlobCommon.validateTags({ tags });
    const { body } = streamUtils.toStreamingBody(file);
    const client = await azureBlobCommon.getServiceClient({
      connectionString: context.auth.props.connectionString,
    });
    const blockBlobClient = client.getContainerClient(container).getBlockBlobClient(blobName);

    const response = await azureBlobCommon.callAzure({
      operation: 'upload blob',
      isWrite: true,
      request: () =>
        blockBlobClient.uploadStream(body, undefined, undefined, {
          tags: Object.keys(validTags).length > 0 ? validTags : undefined,
          blobHTTPHeaders: {
            blobContentType: azureBlobCommon.contentTypeFromName({
              names: [blobName, file.filename],
            }),
          },
        }),
    });

    return {
      container,
      blobName,
      etag: response.etag ?? null,
      lastModified: azureBlobCommon.toIso(response.lastModified),
      versionId: response.versionId ?? null,
      url: azureBlobCommon.stripUrlSecrets(blockBlobClient.url),
    };
  },
});
