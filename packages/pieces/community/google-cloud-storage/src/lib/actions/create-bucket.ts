import { createAction, Property } from '@activepieces/pieces-framework';
import { googleCloudStorageAuth } from '../common/auth';
import { googleCloudStorageProps } from '../common/props';
import { GoogleCloudStorageClient } from '../common/client';
import { OAuth2PropertyValue } from '@activepieces/pieces-framework';

export const createBucket = createAction({
  auth: googleCloudStorageAuth,
  name: 'create_bucket',
  displayName: 'Create Bucket',
  description: 'Create a new bucket in a specified location / configuration.',
  props: {
    // Reusable property from props.ts
    project: googleCloudStorageProps.project(),

    // Action-specific properties defined here
    name: Property.ShortText({
      displayName: 'Bucket Name',
      description: 'The name for the new bucket. Must be globally unique.',
      required: true,
    }),
    location: Property.StaticDropdown({
      displayName: 'Location',
      description: 'The geographical location where the bucket will be created.',
      required: true,
      options: {
        options: [
          { label: 'US (Multi-region)', value: 'US' },
          { label: 'EU (Multi-region)', value: 'EU' },
          { label: 'Asia (Multi-region)', value: 'ASIA' },
          { label: 'us-central1 (Iowa)', value: 'US-CENTRAL1' },
          { label: 'us-east1 (South Carolina)', value: 'US-EAST1' },
          { label: 'us-west1 (Oregon)', value: 'US-WEST1' },
          { label: 'europe-west1 (Belgium)', value: 'EUROPE-WEST1' },
          { label: 'asia-east1 (Taiwan)', value: 'ASIA-EAST1' },
        ],
      },
    }),
    storageClass: Property.StaticDropdown({
      displayName: 'Storage Class',
      description: 'The default storage class for objects in the bucket.',
      required: true,
      options: {
        options: [
          { label: 'Standard', value: 'STANDARD' },
          { label: 'Nearline', value: 'NEARLINE' },
          { label: 'Coldline', value: 'COLDLINE' },
          { label: 'Archive', value: 'ARCHIVE' },
        ],
      },
    }),
    versioning: Property.Checkbox({
      displayName: 'Enable Versioning',
      description: 'If true, enables object versioning for the bucket, which keeps a history of object modifications.',
      required: false,
    }),
    uniformBucketLevelAccess: Property.Checkbox({
        displayName: 'Enable Uniform Bucket-Level Access',
        description: 'If true, enables uniform bucket-level access, which is recommended for consistent permission management.',
        required: false,
        defaultValue: true,
    }),
  },
  async run({ auth, propsValue }) {
    const client = new GoogleCloudStorageClient((auth as OAuth2PropertyValue).access_token);

    const requestBody: any = {
      name: propsValue.name,
      location: propsValue.location,
      storageClass: propsValue.storageClass,
    };

    if (propsValue.versioning) {
        requestBody.versioning = { enabled: true };
    }

    if (propsValue.uniformBucketLevelAccess) {
        requestBody.iamConfiguration = {
            uniformBucketLevelAccess: { enabled: true },
        };
    }
    
    return await client.createBucket(propsValue.project, requestBody);
  },
});