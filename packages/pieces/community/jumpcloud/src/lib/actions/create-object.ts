import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { jumpcloudAuth } from '../auth';
import { jumpcloudApi } from '../common/client';
import { jumpcloudFields } from '../common/fields';
import { jumpcloudObjects } from '../common/objects';
import { jumpcloudOutput } from '../common/output';
import { jumpcloudProps } from '../common/props';
import { ApiRecord, ObjectTypeKey } from '../common/types';

export const createObjectAction = createAction({
    auth: jumpcloudAuth,
    name: 'create_object',
    classification: 'WRITE',
    displayName: 'Create Object',
    description: 'Create a user, group or application. Devices join JumpCloud by installing the agent, so they cannot be created here.',
    audience: 'both',
    aiMetadata: {
        description:
            'Creates a JumpCloud user, user group, device group or SSO/bookmark application and returns it with its new ID. Users need a unique username and email; groups a unique name; applications a display label and URL. Systems (devices) cannot be created through the API. Each call creates a new object, so retries fail on the duplicate name or create duplicates.',
        idempotent: false,
    },
    props: {
        objectType: jumpcloudProps.objectType({ creatableOnly: true }),
        fields: jumpcloudFields.fieldsProp({ mode: 'create' }),
        additionalFields: jumpcloudFields.additionalFieldsProp(),
    },
    async run(context) {
        const type = jumpcloudObjects.parseType(context.propsValue.objectType);
        const config = jumpcloudObjects.config(type);
        if (!config.canCreate) {
            throw new Error(`${config.label} objects cannot be created through the JumpCloud API.`);
        }
        const changes = jumpcloudFields.buildChanges({
            type,
            fields: context.propsValue.fields,
            additionalFields: context.propsValue.additionalFields,
        });
        const created = await jumpcloudApi.send<unknown>({
            auth: context.auth.props,
            method: HttpMethod.POST,
            path: config.path,
            version: config.version,
            body: withCreateDefaults({ type, body: changes }),
        });
        if (!jumpcloudApi.isRecord(created)) {
            throw new Error(`JumpCloud did not return the new ${config.label}.`);
        }
        return jumpcloudOutput.flatten({ type, record: created });
    },
});

function withCreateDefaults({ type, body }: { type: ObjectTypeKey; body: ApiRecord }): ApiRecord {
    if (type !== 'application') {
        return body;
    }
    return { config: {}, ...body, name: typeof body['name'] === 'string' ? body['name'] : 'bookmark' };
}
