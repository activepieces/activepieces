import { Property, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { GoogleCloudStorageClient } from './client';

export const googleCloudStorageProps = {
  project: (displayName = 'Google Cloud Project') =>
    Property.Dropdown({
      displayName: displayName,
      required: true,
      refreshers: [],
      async options({ auth }) {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Connect your account first',
            options: [],
          };
        }
        const authValue = auth as OAuth2PropertyValue;
        const client = new GoogleCloudStorageClient(authValue.access_token);
        const res = await client.listProjects();
        return {
          disabled: false,
          options:
            res.projects?.map((project) => ({
              label: project.name,
              value: project.projectId,
            })) ?? [],
        };
      },
    }),

  bucket: (displayName = 'Bucket', refreshers = ['project']) =>
    Property.Dropdown({
      displayName: displayName,
      required: true,
      refreshers: refreshers,
      async options({ auth, project }) {
        if (!auth || !project) {
          return {
            disabled: true,
            placeholder: 'Connect your account and select a project first',
            options: [],
          };
        }
        const authValue = auth as OAuth2PropertyValue;
        const projectId = project as string;
        const client = new GoogleCloudStorageClient(authValue.access_token);
        const res = await client.listBuckets(projectId);
        return {
          disabled: false,
          options:
            res.items?.map((bucket) => ({
              label: bucket.name,
              value: bucket.name,
            })) ?? [],
        };
      },
    }),
  
  object: (displayName = 'Object', refreshers = ['bucket']) =>
    Property.Dropdown({
        displayName: displayName,
        required: true,
        refreshers: refreshers,
        async options({ auth, bucket }) {
            if (!auth || !bucket) {
                return {
                    disabled: true,
                    placeholder: 'Connect your account and select a bucket first',
                    options: [],
                };
            }
            const authValue = auth as OAuth2PropertyValue;
            const bucketName = bucket as string;
            const client = new GoogleCloudStorageClient(authValue.access_token);
            const res = await client.listObjects(bucketName);
            return {
                disabled: false,
                options:
                    res.items?.map((object) => ({
                        label: object.name,
                        value: object.name,
                    })) ?? [],
            };
        },
    }),
};