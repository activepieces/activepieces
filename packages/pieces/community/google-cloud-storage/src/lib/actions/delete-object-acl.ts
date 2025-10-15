import { createAction, Property } from '@activepieces/pieces-framework';
import { googleCloudStorageAuth } from '../common/auth';
import { googleCloudStorageProps } from '../common/props';
import { GoogleCloudStorageClient } from '../common/client';
import { OAuth2PropertyValue } from '@activepieces/pieces-framework';

export const deleteObjectAcl = createAction({
  auth: googleCloudStorageAuth,
  name: 'delete_object_acl',
  displayName: 'Delete Object ACL',
  description: 'Remove an ACL entry from an object to revoke access.',
  props: {
    project: googleCloudStorageProps.project(),
    bucket: googleCloudStorageProps.bucket(),
    object: googleCloudStorageProps.object(),
    entity_type: Property.StaticDropdown({
        displayName: 'Entity Type',
        description: 'The type of entity to revoke permission from.',
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
    
    await client.deleteObjectAcl(propsValue.bucket, propsValue.object, entity);

    return {
        success: true,
        message: `ACL entry for entity "${entity}" was removed successfully.`
    };
  },
});