import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { jumpcloudAuth } from '../auth';
import { jumpcloudApi } from '../common/client';
import { jumpcloudFields } from '../common/fields';
import { jumpcloudObjects } from '../common/objects';
import { jumpcloudOutput } from '../common/output';
import { jumpcloudProps } from '../common/props';

export const updateObjectAction = createAction({
    auth: jumpcloudAuth,
    name: 'update_object',
    classification: 'WRITE',
    displayName: 'Update Object',
    description: 'Change fields on a user, device, group or application. Fields you leave empty keep their current value.',
    audience: 'both',
    aiMetadata: {
        description:
            'Updates the given fields of one JumpCloud user, system (device), user group, device group or SSO application by ID and returns the updated object. Only provided fields change; to lock or unlock a user use Lock User / Unlock User. Safe to retry with the same values.',
        idempotent: true,
    },
    props: {
        objectType: jumpcloudProps.objectType(),
        objectId: jumpcloudProps.objectId(),
        fields: jumpcloudFields.fieldsProp({ mode: 'update' }),
        additionalFields: jumpcloudFields.additionalFieldsProp(),
    },
    async run(context) {
        const auth = context.auth.props;
        const type = jumpcloudObjects.parseType(context.propsValue.objectType);
        const config = jumpcloudObjects.config(type);
        const id = context.propsValue.objectId.trim();
        const changes = jumpcloudFields.buildChanges({
            type,
            fields: context.propsValue.fields,
            additionalFields: context.propsValue.additionalFields,
        });
        if (Object.keys(changes).length === 0) {
            throw new Error('Fill in at least one field to change, or set Additional Fields.');
        }
        const body = config.replaceOnUpdate
            ? jumpcloudFields.mergeForReplace({ type, current: await jumpcloudObjects.getRecord({ auth, type, id }), changes })
            : changes;
        const updated = await jumpcloudApi.send<unknown>({
            auth,
            method: HttpMethod.PUT,
            path: jumpcloudObjects.itemPath({ type, id }),
            version: config.version,
            body,
        });
        if (!jumpcloudApi.isRecord(updated)) {
            throw new Error(`JumpCloud did not return the updated ${config.label}.`);
        }
        return jumpcloudOutput.flatten({ type, record: updated });
    },
});
