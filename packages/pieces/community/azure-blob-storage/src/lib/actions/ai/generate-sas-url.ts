import { createAction, Property } from '@activepieces/pieces-framework';
import { azureBlobStorageAuth } from '../../auth';
import { azureBlobAiProps, azureBlobCommon } from '../../common/client';
import { aiGenerateSasUrlOutputSchema } from '../../output-schemas';

function hasSharedKeyCredential(credential: unknown): boolean {
  if (typeof credential !== 'object' || credential === null) {
    return false;
  }
  return (
    'accountName' in credential &&
    'computeHMACSHA256' in credential &&
    typeof Reflect.get(credential, 'computeHMACSHA256') === 'function'
  );
}

const DEFAULT_EXPIRY_MINUTES = 60;
const MAX_EXPIRY_MINUTES = 10080;

export const aiGenerateSasUrl = createAction({
  auth: azureBlobStorageAuth,
  name: 'azure_blob_generate_sas_url',
  displayName: 'Generate SAS URL',
  description: 'Creates a time-limited, read-only download link for a blob.',
  audience: 'ai',
  classification: 'READ',
  outputSchema: aiGenerateSasUrlOutputSchema,
  aiMetadata: {
    description:
      'Creates a read-only shared access signature (SAS) URL for one blob that anyone holding it can download until it expires (default 60 minutes, max 7 days). The URL is signed locally with the account key, so the connection must use an account-key connection string; SAS connection strings fail with a clear error. The blob is not checked for existence. Treat the URL as a secret. Use Read Blob instead to get the content inside the flow. Not idempotent: each call returns a new URL.',
    idempotent: false,
  },
  props: {
    container: azureBlobAiProps.containerName(),
    blobName: azureBlobAiProps.blobName(),
    expiresInMinutes: Property.Number({
      displayName: 'Expires In (Minutes)',
      description: 'How long the link stays valid, 1-10080 minutes (7 days). Default 60.',
      required: false,
      defaultValue: DEFAULT_EXPIRY_MINUTES,
    }),
  },
  async run(context) {
    const { container, blobName, expiresInMinutes } = context.propsValue;
    const minutes =
      expiresInMinutes === undefined || expiresInMinutes === null
        ? DEFAULT_EXPIRY_MINUTES
        : Math.floor(expiresInMinutes);
    if (!Number.isFinite(minutes) || minutes < 1 || minutes > MAX_EXPIRY_MINUTES) {
      throw new Error(`Expires In must be between 1 and ${MAX_EXPIRY_MINUTES} minutes.`);
    }
    const sdk = await azureBlobCommon.loadSdk();
    const client = await azureBlobCommon.getServiceClient({
      connectionString: context.auth.props.connectionString,
    });
    const blobClient = client.getContainerClient(container).getBlobClient(blobName);
    const now = Date.now();
    const expiresOn = new Date(now + minutes * 60000);
    if (!hasSharedKeyCredential(blobClient.credential)) {
      throw new Error(
        'Azure Blob generate SAS URL failed: the connection must use an account-key connection string (AccountName=...;AccountKey=...) to sign SAS URLs.'
      );
    }
    const url = await azureBlobCommon.callAzure({
      operation: 'generate SAS URL',
      isWrite: false,
      request: () =>
        blobClient.generateSasUrl({
        permissions: sdk.BlobSASPermissions.parse('r'),
        startsOn: new Date(now - 300000),
        expiresOn,
        protocol: blobClient.url.toLowerCase().startsWith('https:')
          ? sdk.SASProtocol.Https
          : sdk.SASProtocol.HttpsAndHttp,
      }),
    });
    return {
      container,
      blobName,
      url,
      expiresAt: expiresOn.toISOString(),
      permissions: 'r',
    };
  },
});
