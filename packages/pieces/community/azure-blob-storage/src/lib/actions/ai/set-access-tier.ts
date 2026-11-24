import { createAction, Property } from '@activepieces/pieces-framework';
import { azureBlobStorageAuth } from '../../auth';
import { azureBlobAiProps, azureBlobCommon } from '../../common/client';
import { aiSetAccessTierOutputSchema } from '../../output-schemas';

const TIERS = ['Hot', 'Cool', 'Cold', 'Archive'];

export const aiSetAccessTier = createAction({
  auth: azureBlobStorageAuth,
  name: 'azure_blob_set_access_tier',
  displayName: 'Set Access Tier',
  description: 'Changes the access tier (Hot, Cool, Cold, Archive) of a block blob.',
  audience: 'ai',
  classification: 'WRITE',
  outputSchema: aiSetAccessTierOutputSchema,
  aiMetadata: {
    description:
      'Changes the access tier of one block blob in a general-purpose v2 or Blob Storage account: Hot, Cool, Cold or Archive. Moving to Archive makes the blob unreadable until it is rehydrated by setting Hot, Cool or Cold again, which can take hours; early-deletion charges may apply when leaving Cool, Cold or Archive early. Returns the tier actually in effect after the call (accessTier) plus archiveStatus, e.g. "rehydrate-pending-to-hot" while an archived blob is still rehydrating, and rehydratePriority. Idempotent: setting the current tier again has no further effect.',
    idempotent: true,
  },
  props: {
    container: azureBlobAiProps.containerName(),
    blobName: azureBlobAiProps.blobName(),
    tier: Property.StaticDropdown<string>({
      displayName: 'Access Tier',
      description: 'The target access tier.',
      required: true,
      options: {
        options: [
          { label: 'Hot', value: 'Hot' },
          { label: 'Cool', value: 'Cool' },
          { label: 'Cold', value: 'Cold' },
          { label: 'Archive', value: 'Archive' },
        ],
      },
    }),
  },
  async run(context) {
    const { container, blobName, tier } = context.propsValue;
    if (tier === undefined || !TIERS.includes(tier)) {
      throw new Error(`Access Tier must be one of ${TIERS.join(', ')}.`);
    }
    const client = await azureBlobCommon.getServiceClient({
      connectionString: context.auth.props.connectionString,
    });
    const blobClient = client.getContainerClient(container).getBlobClient(blobName);
    await azureBlobCommon.callAzure({
      operation: 'set access tier',
      isWrite: true,
      request: () => blobClient.setAccessTier(tier),
    });
    const properties = await azureBlobCommon.callAzure({
      operation: 'get blob properties',
      isWrite: false,
      request: () => blobClient.getProperties(),
    });
    return {
      container,
      blobName,
      requestedTier: tier,
      accessTier: properties.accessTier ?? null,
      archiveStatus: properties.archiveStatus ?? null,
      rehydratePriority: properties.rehydratePriority ?? null,
    };
  },
});
