import { Property, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { GoogleCloudStorageClient } from './client';

export const googleCloudStorageProps = {
  project: (displayName = 'Google Cloud Project ID') =>
    Property.ShortText({
      displayName: displayName,
      description: 'Enter the ID of your Google Cloud project.',
      required: true,
    }),

  bucket: (displayName = 'Bucket', refreshers: string[] = ['project']) =>
    Property.Dropdown({
      displayName: displayName,
      required: true,
      refreshers: refreshers,
      async options({ auth, ...props }) {
        const projectId = props[refreshers[0]] as string | undefined;

        if (!auth || !projectId) {
          return {
            disabled: true,
            placeholder: 'Connect your account and enter a Project ID first',
            options: [],
          };
        }
        
        try {
            const authValue = auth as OAuth2PropertyValue;
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
        } catch (e) {
            return {
                disabled: true,
                placeholder: "Error: Check Project ID or permissions.",
                options: []
            }
        }
      },
    }),
  
  object: (displayName = 'Object', refreshers: string[] = ['bucket']) =>
    Property.Dropdown({
        displayName: displayName,
        required: true,
        refreshers: refreshers,
        async options({ auth, ...props }) {
            const bucketName = props[refreshers[0]] as string | undefined;

            if (!auth || !bucketName) {
                return {
                    disabled: true,
                    placeholder: 'Connect your account and select a bucket first',
                    options: [],
                };
            }
            
            try {
                const authValue = auth as OAuth2PropertyValue;
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
            } catch (e) {
                return {
                    disabled: true,
                    placeholder: "Error fetching objects from bucket.",
                    options: []
                }
            }
        },
    }),
};