import { createAction, Property } from '@activepieces/pieces-framework';
import { googleCloudStorageAuth } from '../common/auth';
import { googleCloudStorageProps } from '../common/props';
import { GoogleCloudStorageClient } from '../common/client';
import { OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { HttpError } from '@activepieces/pieces-common';

export const createBucket = createAction({
  auth: googleCloudStorageAuth,
  name: 'create_bucket',
  displayName: 'Create Bucket',
  description: 'Create a new bucket in a specified location / configuration.',
  props: {
    project: googleCloudStorageProps.project(),
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
      description:
        'If true, enables object versioning for the bucket, which keeps a history of object modifications.',
      required: false,
    }),
    uniformBucketLevelAccess: Property.Checkbox({
      displayName: 'Enable Uniform Bucket-Level Access',
      description:
        'If true, enables uniform bucket-level access, which is recommended for consistent permission management.',
      required: false,
      defaultValue: true,
    }),
  },
  async run({ auth, propsValue }) {
    const client = new GoogleCloudStorageClient(
      (auth as OAuth2PropertyValue).access_token
    );

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

    try {
      return await client.createBucket(propsValue.project, requestBody);
    } catch (error) {
      if (error instanceof HttpError) {
        let errorBody;
        try {
          errorBody = JSON.parse(error.message);
        } catch (e) {
          throw new Error(`An unexpected HTTP error occurred: ${error.message}`);
        }

        const errorCode = errorBody.response?.body?.error?.code;

        switch (errorCode) {
          case 409:
            throw new Error(
              `Bucket name "${propsValue.name}" is already taken. Bucket names must be globally unique. Please choose a different name.`
            );
          case 403:
            throw new Error(
              "Permission Denied. This can happen for two main reasons: 1) The project you selected does not have an active billing account linked. 2) Your account lacks the 'Storage Admin' role or the necessary permissions to create buckets in this project."
            );
          default:
            throw new Error(`An unexpected HTTP error occurred: ${JSON.stringify(errorBody.response?.body)}`);
        }
      }
      throw error;
    }
  },
});