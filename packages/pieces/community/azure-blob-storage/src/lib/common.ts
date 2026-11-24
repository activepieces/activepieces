import { Property } from '@activepieces/pieces-framework';
import { azureBlobStorageAuth } from './auth';
import { azureBlobCommon } from './common/client';

const DROPDOWN_LIMIT = 1000;

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
    }
    try {
      const client = await azureBlobCommon.getServiceClient({
        connectionString: auth.props.connectionString,
      });
      const options: { label: string; value: string }[] = [];
      for await (const page of client
        .listContainers()
        .byPage({ maxPageSize: DROPDOWN_LIMIT })) {
        for (const container of page.containerItems) {
          options.push({ label: container.name, value: container.name });
        }
        if (options.length >= DROPDOWN_LIMIT) {
          break;
        }
      }
      return {
        disabled: false,
        options: options.slice(0, DROPDOWN_LIMIT),
        placeholder:
          options.length >= DROPDOWN_LIMIT
            ? 'Showing the first 1000 containers; map the name if yours is missing'
            : 'Select a container',
      };
    } catch (error) {
      return {
        disabled: true,
        options: [],
        placeholder: azureBlobCommon.mapAzureError({
          error,
          operation: 'list containers',
          isWrite: false,
        }).message,
      };
    }
  },
});
