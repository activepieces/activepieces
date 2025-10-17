import { createAction, Property } from '@activepieces/pieces-framework';
import { googleCloudStorageAuth } from '../common/auth';
import { googleCloudStorageProps } from '../common/props';
import { GoogleCloudStorageClient } from '../common/client';
import { OAuth2PropertyValue } from '@activepieces/pieces-framework';

export const createBucketDefaultObjectAcl = createAction({
  auth: googleCloudStorageAuth,
  name: 'create_bucket_default_object_acl',
  displayName: 'Create Bucket Default Object ACL',
  description: 'Set default ACLs for new objects added to a bucket.',
  props: {
    project: googleCloudStorageProps.project(),
    bucket: googleCloudStorageProps.bucket(),
    role: Property.StaticDropdown({
        displayName: 'Role',
        description: 'The permission to grant to the entity for all new objects.',
        required: true,
        options: {
            options: [
                { label: 'Reader (Can view and download)', value: 'READER' },
                { label: 'Owner (Full control of the object)', value: 'OWNER' },
            ],
        },
    }),
    entity_type: Property.StaticDropdown({
        displayName: 'Entity Type',
        description: 'The type of entity to grant permission to.',
        required: true,
        options: {
            options: [
                { label: 'User', value: 'user' },
                { label: 'Group', value: 'group' },
                { label: 'Domain', value: 'domain' },
                { label: 'All Users (Public)', value: 'allUsers' },
                { label: 'All Authenticated Users', value: 'allAuthenticatedUsers' },
            ],
        }
    }),
    entity_value: Property.ShortText({
        displayName: 'Entity Identifier (Email or Domain)',
        description: "The email address or domain for the entity (e.g., 'test@example.com'). Not needed for 'All Users' types.",
        required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const client = new GoogleCloudStorageClient(
      (auth as OAuth2PropertyValue).access_token
    );

    let entity = propsValue.entity_type;
    if (propsValue.entity_value) {
        entity = `${propsValue.entity_type}-${propsValue.entity_value}`;
    }

    if (!propsValue.entity_value && !['allUsers', 'allAuthenticatedUsers'].includes(propsValue.entity_type)) {
        throw new Error("Entity Identifier is required for User, Group, or Domain types.");
    }
    
    return await client.createBucketDefaultObjectAcl(propsValue.bucket, {
        entity: entity,
        role: propsValue.role as 'READER' | 'OWNER',
    });
  },
});