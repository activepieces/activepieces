import { isPieceServerContextError, PieceAuth, Property } from '@activepieces/pieces-framework';

import { gcsWorkloadIdentity } from './workload-identity';

export const googleCloudStorageOAuth2Auth = PieceAuth.OAuth2({
  displayName: 'Google Account (OAuth2)',
  description: '',
  authUrl: 'https://accounts.google.com/o/oauth2/auth',
  tokenUrl: 'https://oauth2.googleapis.com/token',
  required: true,
  scope: [
    'https://www.googleapis.com/auth/devstorage.read_write',
    'https://www.googleapis.com/auth/devstorage.full_control',
    'https://www.googleapis.com/auth/cloud-platform.read-only',
    'https://www.googleapis.com/auth/pubsub',
    'email'
  ],
});

const oidcDescription = `
Connect through **Workload Identity Federation**: no client secret or service account key is stored.

📖 **[Setup guide](https://github.com/activepieces/activepieces/blob/main/packages/pieces/community/google-cloud-storage/docs/workload-identity-federation.md)**: pool, provider, roles and troubleshooting.

Values for your Google Cloud provider:
- **Issuer URL:** \`{{frontendUrl}}\`
- **Subject:** \`platform:{{platformId}}:project:{{projectId}}\`
`.trim();

export const googleCloudStorageOidcAuth = PieceAuth.OIDC({
  displayName: 'Workload Identity Federation (OIDC)',
  description: oidcDescription,
  props: {
    projectNumber: Property.ShortText({
      displayName: 'Project Number',
      description: 'Number (not ID) of the Google Cloud project that owns the workload identity pool, e.g. 123456789012.',
      required: true,
    }),
    poolId: Property.ShortText({
      displayName: 'Workload Identity Pool ID',
      required: true,
    }),
    providerId: Property.ShortText({
      displayName: 'Workload Identity Provider ID',
      required: true,
    }),
    serviceAccountEmail: Property.ShortText({
      displayName: 'Service Account Email (Optional)',
      description: 'Service account to impersonate. The federated principal needs roles/iam.workloadIdentityUser on it. Leave empty to use the federated identity directly.',
      required: false,
    }),
  },
  validate: async ({ auth, server }) => {
    try {
      await gcsWorkloadIdentity.exchangeAccessToken({ props: auth, server });
      return { valid: true };
    } catch (error) {
      if (isPieceServerContextError(error)) throw error;
      return { valid: false, error: gcsWorkloadIdentity.formatError(error) };
    }
  },
  required: true,
});

export const googleCloudStorageAuth = [googleCloudStorageOAuth2Auth, googleCloudStorageOidcAuth];
