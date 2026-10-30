import type { AppConnectionValueForAuthProperty } from '@activepieces/pieces-framework';

import type { googleCloudStorageAuth } from './auth';

export type GoogleCloudStorageAuthValue = AppConnectionValueForAuthProperty<typeof googleCloudStorageAuth>;

export type GoogleCloudStorageWorkloadIdentityProps = {
  projectNumber: string;
  poolId: string;
  providerId: string;
  serviceAccountEmail?: string;
};

export type GoogleCloudStorageAccessToken = {
  accessToken: string;
  expiresAtMS: number;
};
