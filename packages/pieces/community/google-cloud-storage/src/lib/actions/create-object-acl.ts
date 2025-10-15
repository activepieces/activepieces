import { createAction, Property } from '@activepieces/pieces-framework';
import { googleCloudStorageAuth } from '../common/auth';
import { googleCloudStorageProps } from '../common/props';
import { GoogleCloudStorageClient } from '../common/client';
import { OAuth2PropertyValue } from '@activepieces/pieces-framework';

export const createObjectAcl = createAction({
  auth: googleCloudStorageAuth,
  name: 'create_object_acl',
  displayName: 'Create Object ACL',
  description: 'Add an ACL entry to an object to grant a permission.',
  props: {
    project: googleCloudStorageProps.project(),
    bucket: googleCloudStorageProps.bucket(),
    object: googleCloudStorageProps.object(),
    role: Property.StaticDropdown({
        displayName: 'Role',
        description: 'The permission to grant to the entity.',
        required: true,
        options: {
            options: [
                { label: 'Reader (Can view and download)', value: 'READER' },
                { label: 'Owner (Full control)', value: 'OWNER' },
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
        description: "The email address or domain for the entity (e.g., 'test@example.com' or 'example.com'). Not needed for 'All Users' types.",
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
    
    return await client.createObjectAcl(propsValue.bucket, propsValue.object, {
        entity: entity,
        role: propsValue.role as 'READER' | 'OWNER',
    });
  },
});