import { PieceAuth, Property } from '@activepieces/pieces-framework';
import { azureBlobCommon } from './common/client';

export const azureBlobStorageAuth = PieceAuth.CustomAuth({
  displayName: 'Azure Blob Storage Auth',
  description:
    'Authenticate with an Azure Storage connection string. Use the account-key connection string from the storage account (Security + networking > Access keys), or a SAS connection string (BlobEndpoint=...;SharedAccessSignature=...). For the local Azurite emulator use UseDevelopmentStorage=true. Generating SAS URLs requires the account-key connection string.',
  props: {
    connectionString: Property.ShortText({
      displayName: 'Connection String',
      description:
        "You can obtain it from 'Security + networking -> Access Keys' menu, or build a SAS connection string from 'Shared access signature'.",
      required: true,
    }),
  },
  required: true,
  validate: async ({ auth }) => {
    let client;
    try {
      client = await azureBlobCommon.getServiceClient({
        connectionString: auth.connectionString,
      });
    } catch (error) {
      return {
        valid: false,
        error: `Invalid connection string: ${
          error instanceof Error ? error.message : String(error)
        }`,
      };
    }
    try {
      await client.getAccountInfo();
      return { valid: true };
    } catch (accountError) {
      try {
        await client.listContainers().byPage({ maxPageSize: 1 }).next();
        return { valid: true };
      } catch {
        return {
          valid: false,
          error: azureBlobCommon.mapAzureError({
            error: accountError,
            operation: 'connection check',
            isWrite: false,
          }).message,
        };
      }
    }
  },
});
