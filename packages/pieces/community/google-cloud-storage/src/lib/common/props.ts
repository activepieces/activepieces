import { Property, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { gcsCommon } from './client';
import { HttpMethod } from '@activepieces/pieces-common';
import { googleCloudStorageAuth } from './auth';

export const bucketDropdown = Property.Dropdown<string,true,typeof googleCloudStorageAuth>({
  displayName: 'Bucket',
  required: true,
  refreshers: ['projectId'],
  auth: googleCloudStorageAuth,
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
  Property.Dropdown<string,true,typeof googleCloudStorageAuth>({
    displayName: 'Object',
    required: true,   
    auth: googleCloudStorageAuth,
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

export const projectIdProperty = Property.Dropdown<string,true,typeof googleCloudStorageAuth>({
  displayName: 'Project',
  required: true,
  auth: googleCloudStorageAuth,
  refreshers: [],
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Please connect your account first',
      };
    }

    try {
      const authValue = auth as OAuth2PropertyValue;
      // Use Google Cloud Resource Manager API to list projects
      const response = await gcsCommon.makeRequest(
        HttpMethod.GET,
        'https://cloudresourcemanager.googleapis.com/v1/projects?filter=lifecycleState:ACTIVE',
        authValue.access_token
      );

      return {
        disabled: false,
        options: response.projects?.map((project: any) => ({
          label: `${project.displayName || project.name} (${project.projectId})`,
          value: project.projectId,
        })) || [],
      };
    } catch (error) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Failed to load projects. Check your permissions.',
      };
    }
  },
});

export const bucketNameProperty = Property.ShortText({
  displayName: 'Bucket Name',
  description: 'Unique name for your bucket (must be globally unique, 3-63 characters)',
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
      // Multi-region
      { label: 'US (Multi-region)', value: 'US' },
      { label: 'EU (Multi-region)', value: 'EU' },
      { label: 'ASIA (Multi-region)', value: 'ASIA' },
      // US regions
      { label: 'us-central1 (Iowa)', value: 'us-central1' },
      { label: 'us-east1 (South Carolina)', value: 'us-east1' },
      { label: 'us-east4 (Northern Virginia)', value: 'us-east4' },
      { label: 'us-west1 (Oregon)', value: 'us-west1' },
      { label: 'us-west2 (Los Angeles)', value: 'us-west2' },
      { label: 'us-west3 (Salt Lake City)', value: 'us-west3' },
      { label: 'us-west4 (Las Vegas)', value: 'us-west4' },
      { label: 'us-south1 (Dallas)', value: 'us-south1' },
      // Europe regions
      { label: 'europe-central2 (Warsaw)', value: 'europe-central2' },
      { label: 'europe-north1 (Finland)', value: 'europe-north1' },
      { label: 'europe-southwest1 (Madrid)', value: 'europe-southwest1' },
      { label: 'europe-west1 (Belgium)', value: 'europe-west1' },
      { label: 'europe-west2 (London)', value: 'europe-west2' },
      { label: 'europe-west3 (Frankfurt)', value: 'europe-west3' },
      { label: 'europe-west4 (Netherlands)', value: 'europe-west4' },
      { label: 'europe-west6 (Zurich)', value: 'europe-west6' },
      { label: 'europe-west8 (Milan)', value: 'europe-west8' },
      { label: 'europe-west9 (Paris)', value: 'europe-west9' },
      // Asia regions
      { label: 'asia-east1 (Taiwan)', value: 'asia-east1' },
      { label: 'asia-east2 (Hong Kong)', value: 'asia-east2' },
      { label: 'asia-northeast1 (Tokyo)', value: 'asia-northeast1' },
      { label: 'asia-northeast2 (Osaka)', value: 'asia-northeast2' },
      { label: 'asia-northeast3 (Seoul)', value: 'asia-northeast3' },
      { label: 'asia-south1 (Mumbai)', value: 'asia-south1' },
      { label: 'asia-south2 (Delhi)', value: 'asia-south2' },
      { label: 'asia-southeast1 (Singapore)', value: 'asia-southeast1' },
      { label: 'asia-southeast2 (Jakarta)', value: 'asia-southeast2' },
      // Other regions
      { label: 'australia-southeast1 (Sydney)', value: 'australia-southeast1' },
      { label: 'australia-southeast2 (Melbourne)', value: 'australia-southeast2' },
      { label: 'northamerica-northeast1 (Montreal)', value: 'northamerica-northeast1' },
      { label: 'northamerica-northeast2 (Toronto)', value: 'northamerica-northeast2' },
      { label: 'southamerica-east1 (São Paulo)', value: 'southamerica-east1' },
      { label: 'southamerica-west1 (Santiago)', value: 'southamerica-west1' },
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
      { label: 'Multi-regional', value: 'MULTI_REGIONAL' },
      { label: 'Regional', value: 'REGIONAL' },
      { label: 'Durable Reduced Availability', value: 'DURABLE_REDUCED_AVAILABILITY' },
    ],
  },
});

export const aclEntityProperty = Property.ShortText({
  displayName: 'Entity',
  description: 'The entity to grant access to. Must include the entity type prefix. Format: user-emailAddress, group-groupId, group-emailAddress, domain-domainName, project-team-projectId, allUsers, or allAuthenticatedUsers. Examples: user-liz@example.com, group-mygroup@googlegroups.com, domain-example.com, allUsers',
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

// For bucket ACLs - supports OWNER, WRITER, READER
export const bucketAclRoleProperty = Property.StaticDropdown({
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

// For object ACLs - supports OWNER, READER only
export const objectAclRoleProperty = Property.StaticDropdown({
  displayName: 'Role',
  required: true,
  options: {
    options: [
      { label: 'Reader', value: 'READER' },
      { label: 'Owner', value: 'OWNER' },
    ],
  },
});
