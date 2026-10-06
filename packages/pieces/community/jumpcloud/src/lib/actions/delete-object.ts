import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { jumpcloudAuth } from '../auth';
import { jumpcloudApi } from '../common/client';
import { jumpcloudObjects } from '../common/objects';
import { jumpcloudProps } from '../common/props';

export const deleteObjectAction = createAction({
    auth: jumpcloudAuth,
    name: 'delete_object',
    classification: 'DESTRUCTIVE',
    displayName: 'Delete Object',
    description: 'Permanently delete a user, device, group or application.',
    audience: 'both',
    aiMetadata: {
        description:
            'Permanently deletes one JumpCloud user, system (device), user group, device group or SSO application by ID. Deleting a system removes it from management; deleting a user removes their access everywhere JumpCloud provisions it. Prefer Lock User to suspend access reversibly. Not safe to retry: a second call fails with not found.',
        idempotent: false,
    },
    props: {
        objectType: jumpcloudProps.objectType(),
        objectId: jumpcloudProps.objectId({ description: 'The object to delete. This cannot be undone.' }),
    },
    async run(context) {
        const type = jumpcloudObjects.parseType(context.propsValue.objectType);
        const id = context.propsValue.objectId.trim();
        await jumpcloudApi.send<unknown>({
            auth: context.auth.props,
            method: HttpMethod.DELETE,
            path: jumpcloudObjects.itemPath({ type, id }),
            version: jumpcloudObjects.config(type).version,
        });
        return { id, object_type: type, deleted: true };
    },
});
