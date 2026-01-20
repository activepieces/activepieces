import { createAction, Property } from '@activepieces/pieces-framework';
import { azureBlobStorageAuth } from '../../index';
import { BlobServiceClient } from '@azure/storage-blob';

export const listContainers = createAction({
  auth: azureBlobStorageAuth,
  name: 'listContainers',
  displayName: 'List Containers',
  description: 'List Containers in the Azure Blob Storage account',
  props: {
    includeDeleted: Property.Checkbox({
      displayName: 'Include Deleted Containers',
      description: 'Whether to include deleted containers in the list',
      required: false,
      defaultValue: false,
    }),
    includeSystem: Property.Checkbox({
      displayName: 'Include System Containers',
      description: 'Whether to include system containers in the list',
      required: false,
      defaultValue: true,
    }),
    prefix: Property.ShortText({
      displayName: 'Prefix Filter',
      description: 'Filter containers by prefix',
      required: false,
    }),
  },
  async run(context) {
    const { includeDeleted, includeSystem, prefix } = context.propsValue;
    const auth = context.auth.props;

    const blobServiceClient = BlobServiceClient.fromConnectionString(auth.connectionString);

    const options = {
      includeDeleted: includeDeleted,
      includeMetadata: true,
      includeSystem: includeSystem,
      prefix: prefix,
    };

    const containers = [];
    for await (const container of blobServiceClient.listContainers(options)) {
      containers.push({
        name: container.name,
        properties: container.properties,
        metadata: container.metadata,
      });
    };

    return containers;
  },
});
