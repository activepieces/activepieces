import { Property } from '@activepieces/pieces-framework';
import { BlobServiceClient } from '@azure/storage-blob';
import { azureBlobStorageAuth } from '..';

export const containerProp = Property.Dropdown({
    displayName: 'Container',
    description: 'Select the container',
    required: true,
    auth: azureBlobStorageAuth,
    refreshers: ['auth'],
    options: async ({ auth }) => {
        if (!auth) {
            return {
                disabled: true,
                options: [],
                placeholder: 'Please authenticate first',
            };
        };

        const blobServiceClient = BlobServiceClient.fromConnectionString(auth.props.connectionString);
        const containers = [];
        for await (const container of blobServiceClient.listContainers()) {
            containers.push({
                label: container.name,
                value: container.name,
            });
        }

        return {
            disabled: false,
            options: containers,
            placeholder: 'Select a container',
        }
    }
})