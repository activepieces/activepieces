import { Property, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { gcsCommon } from './client';
import { HttpMethod } from '@activepieces/pieces-common';

export const bucketDropdown = Property.Dropdown<string>({
  displayName: 'Bucket',
  required: true,
  refreshers: ['projectId'],
  options: async ({ auth, projectId }) => {
    if (!auth || !projectId) {
      return {
        disabled: true,
        options: [],
        placeholder: projectId
          ? 'Please connect your account first'
          : 'Please enter project ID first',
      };
    }

    try {
      const authValue = auth as OAuth2PropertyValue;
      const response = await gcsCommon.makeRequest(
        HttpMethod.GET,
        `/b?project=${projectId}`,
        authValue.access_token
      );

      return {
        disabled: false,
        options:
          response.items?.map((bucket: any) => ({
            label: bucket.name,
            value: bucket.name,
          })) || [],
      };
    } catch (error) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Failed to load buckets',
      };
    }
  },
});

export const objectDropdown = (bucketProperty: string) =>
  Property.Dropdown<string>({
    displayName: 'Object',
    required: true,
    refreshers: [bucketProperty],
    options: async ({ auth, [bucketProperty]: bucket }) => {
      if (!auth || !bucket) {
        return {
          disabled: true,
          options: [],
          placeholder: bucket
            ? 'Please connect your account first'
            : 'Please select a bucket first',
        };
      }

      try {
        const authValue = auth as OAuth2PropertyValue;
        const response = await gcsCommon.makeRequest(
          HttpMethod.GET,
          `/b/${bucket}/o?maxResults=100`,
          authValue.access_token
        );

        return {
          disabled: false,
          options:
            response.items?.map((object: any) => ({
              label: object.name,
              value: object.name,
            })) || [],
        };
      } catch (error) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Failed to load objects',
        };
      }
    },
  });

export const projectIdProperty = Property.ShortText({
  displayName: 'Project ID',
  required: true,
});

export const bucketNameProperty = Property.ShortText({
  displayName: 'Bucket Name',
  required: true,
});

export const objectNameProperty = Property.ShortText({
  displayName: 'Object Name',
  required: true,
});

export const locationProperty = Property.StaticDropdown({
  displayName: 'Location',
  required: false,
  options: {
    options: [
      { label: 'US (Multi-region)', value: 'US' },
      { label: 'EU (Multi-region)', value: 'EU' },
      { label: 'ASIA (Multi-region)', value: 'ASIA' },
      { label: 'us-central1', value: 'us-central1' },
      { label: 'us-east1', value: 'us-east1' },
      { label: 'us-west1', value: 'us-west1' },
      { label: 'europe-west1', value: 'europe-west1' },
      { label: 'asia-east1', value: 'asia-east1' },
    ],
  },
});

export const storageClassProperty = Property.StaticDropdown({
  displayName: 'Storage Class',
  required: false,
  options: {
    options: [
      { label: 'Standard', value: 'STANDARD' },
      { label: 'Nearline', value: 'NEARLINE' },
      { label: 'Coldline', value: 'COLDLINE' },
      { label: 'Archive', value: 'ARCHIVE' },
    ],
  },
});

export const aclEntityProperty = Property.ShortText({
  displayName: 'Entity',
  description: 'The entity (user, group, domain, etc.) to grant access to',
  required: true,
});

export const aclRoleProperty = Property.StaticDropdown({
  displayName: 'Role',
  required: true,
  options: {
    options: [
      { label: 'Reader', value: 'READER' },
      { label: 'Writer', value: 'WRITER' },
      { label: 'Owner', value: 'OWNER' },
    ],
  },
});
