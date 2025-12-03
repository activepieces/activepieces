import { createAction, Property, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { googleCloudStorageAuth } from '../common/auth';
import { gcsCommon } from '../common/client';
import { projectIdProperty, bucketNameProperty, locationProperty, storageClassProperty } from '../common/props';
import { HttpMethod } from '@activepieces/pieces-common';

export const createBucket = createAction({
  auth: googleCloudStorageAuth,
  name: 'create_bucket',
  displayName: 'Create Bucket',
  description: 'Create a new bucket in a specified location/configuration. Perfect for automating storage provisioning for new projects.',
  props: {
    projectId: projectIdProperty,
    name: bucketNameProperty,
    location: locationProperty,
    storageClass: storageClassProperty,
    versioning: Property.Checkbox({
      displayName: 'Enable Versioning',
      required: false,
    }),
    uniformBucketLevelAccess: Property.Checkbox({
      displayName: 'Uniform Bucket Level Access',
      required: false,
    }),
    labels: Property.Object({
      displayName: 'Labels',
      description: 'Key-value pairs for bucket labels',
      required: false,
    }),
  },
  async run(context) {
    const { projectId, name, location, storageClass, versioning, uniformBucketLevelAccess, labels } = context.propsValue;
    const auth = context.auth as OAuth2PropertyValue;

    const bucketConfig: any = {
      name,
      location: location || 'US',
      storageClass: storageClass || 'STANDARD',
    };

    if (versioning) {
      bucketConfig.versioning = { enabled: true };
    }

    if (uniformBucketLevelAccess !== undefined) {
      bucketConfig.iamConfiguration = {
        uniformBucketLevelAccess: {
          enabled: uniformBucketLevelAccess,
        },
      };
    }

    if (labels) {
      bucketConfig.labels = labels;
    }

    try {
      const response = await gcsCommon.makeRequest(HttpMethod.POST, `/b?project=${projectId}`, auth.access_token, bucketConfig);
      return response;
    } catch (error: any) {
      if (error.response?.status === 409) {
        throw new Error(`Bucket "${name}" already exists. Bucket names must be globally unique.`);
      }
      if (error.response?.status === 403) {
        throw new Error('Access denied. Check your permissions for the selected project.');
      }
      if (error.response?.status === 400) {
        throw new Error('Invalid bucket configuration. Check bucket name format and project settings.');
      }
      throw new Error(`Failed to create bucket: ${error.message || 'Unknown error'}`);
    }
  },
});