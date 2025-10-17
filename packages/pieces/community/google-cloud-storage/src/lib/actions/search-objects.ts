import { createAction, Property } from '@activepieces/pieces-framework';
import { googleCloudStorageAuth } from '../common/auth';
import { googleCloudStorageProps } from '../common/props';
import { GoogleCloudStorageClient } from '../common/client';
import { OAuth2PropertyValue } from '@activepieces/pieces-framework';

export const searchObjects = createAction({
  auth: googleCloudStorageAuth,
  name: 'search_objects',
  displayName: 'Search Objects',
  description: 'Search for objects within a bucket using various criteria.',
  props: {
    project: googleCloudStorageProps.project(),
    bucket: googleCloudStorageProps.bucket(),
    prefix: Property.ShortText({
        displayName: 'Prefix (Folder Path)',
        description: "Search for objects that begin with this prefix. For example, 'images/2025/' to find all objects in that 'folder'.",
        required: false,
    }),
    directory_mode: Property.Checkbox({
        displayName: 'Directory Mode (No Subfolders)',
        description: 'If checked, this will only return objects and "subfolders" at the current prefix level, not recursively.',
        required: false,
    }),
    max_results: Property.Number({
        displayName: 'Max Results',
        description: 'The maximum number of objects to return. The default is 1000.',
        required: false,
    }),
    include_versions: Property.Checkbox({
        displayName: 'Include All Versions',
        description: 'If checked, the search will include all versions of an object if versioning is enabled on the bucket.',
        required: false,
    })
  },
  async run({ auth, propsValue }) {
    const client = new GoogleCloudStorageClient(
      (auth as OAuth2PropertyValue).access_token
    );

    return await client.searchObjects({
        bucketName: propsValue.bucket,
        prefix: propsValue.prefix,
        delimiter: propsValue.directory_mode ? '/' : undefined,
        maxResults: propsValue.max_results,
        versions: propsValue.include_versions
    });
  },
});