import { createAction } from '@activepieces/pieces-framework';
import { azureBlobStorageAuth } from '../../auth';
import { azureBlobAiProps, azureBlobCommon } from '../../common/client';
import { aiGetBlobPropertiesOutputSchema } from '../../output-schemas';

export const aiGetBlobProperties = createAction({
  auth: azureBlobStorageAuth,
  name: 'azure_blob_get_blob_properties',
  displayName: 'Get Blob Properties',
  description: 'Gets the properties and metadata of one blob without downloading it.',
  audience: 'ai',
  classification: 'READ',
  outputSchema: aiGetBlobPropertiesOutputSchema,
  aiMetadata: {
    description:
      'Returns the properties of one blob without downloading its content: size in bytes, content type and encoding, last-modified and created times, ETag, access tier, blob type, version id, tag count, lease state and custom metadata. Use to check a blob exists or inspect it before Read Blob; fails with BlobNotFound if it does not exist. Use Get Blob Tags for the tag values. Read-only.',
    idempotent: true,
  },
  props: {
    container: azureBlobAiProps.containerName(),
    blobName: azureBlobAiProps.blobName(),
  },
  async run(context) {
    const { container, blobName } = context.propsValue;
    const client = await azureBlobCommon.getServiceClient({
      connectionString: context.auth.props.connectionString,
    });
    const blobClient = client.getContainerClient(container).getBlobClient(blobName);
    const properties = await azureBlobCommon.callAzure({
      operation: 'get blob properties',
      isWrite: false,
      request: () => blobClient.getProperties(),
      notFoundMessage: `blob "${blobName}" not found in container "${container}".`,
    });
    return {
      container,
      blobName,
      size: properties.contentLength ?? null,
      contentType: properties.contentType ?? null,
      contentEncoding: properties.contentEncoding ?? null,
      lastModified: azureBlobCommon.toIso(properties.lastModified),
      createdOn: azureBlobCommon.toIso(properties.createdOn),
      etag: properties.etag ?? null,
      accessTier: properties.accessTier ?? null,
      blobType: properties.blobType ?? null,
      versionId: properties.versionId ?? null,
      tagCount: properties.tagCount ?? 0,
      leaseState: properties.leaseState ?? null,
      archiveStatus: properties.archiveStatus ?? null,
      rehydratePriority: properties.rehydratePriority ?? null,
      metadata: azureBlobCommon.toStringMap(properties.metadata),
    };
  },
});
