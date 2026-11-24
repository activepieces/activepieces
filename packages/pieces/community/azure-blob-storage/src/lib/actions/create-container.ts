import { createAction, Property } from '@activepieces/pieces-framework';
import { azureBlobStorageAuth } from '../auth';
import { azureBlobCommon } from '../common/client';
import { createContainerOutputSchema } from '../output-schemas';

export const createContainer = createAction({
  auth: azureBlobStorageAuth,
  name: 'createContainer',
  classification: 'WRITE',
  displayName: 'Create Container',
  description: 'Creates a new container',
  audience: 'both',
  outputSchema: createContainerOutputSchema,
  aiMetadata: { description: 'Creates a new private container in the Azure Blob Storage account with the given name (3-63 lowercase letters, digits and hyphens). Use when you need a fresh container to store blobs; use List Containers to check existing names first. Not idempotent: the call fails with ContainerAlreadyExists if the name is taken.', idempotent: false },
  props: {
    containerName: Property.ShortText({
      displayName: 'Container Name',
      description: 'The name for the newly created container',
      required: true,
    }),
  },
  async run(context) {
    const { containerName } = context.propsValue;
    const client = await azureBlobCommon.getServiceClient({
      connectionString: context.auth.props.connectionString,
    });
    const { containerCreateResponse, containerClient } = await azureBlobCommon.callAzure({
      operation: 'create container',
      isWrite: true,
      request: () => client.createContainer(containerName.trim()),
    });

    return {
      containerName: containerClient.containerName,
      accountName: containerClient.accountName,
      etag: containerCreateResponse.etag ?? null,
      lastModified: azureBlobCommon.toIso(containerCreateResponse.lastModified),
      url: azureBlobCommon.stripUrlSecrets(containerClient.url),
    };
  },
});
