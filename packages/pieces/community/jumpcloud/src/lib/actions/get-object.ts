import { createAction } from '@activepieces/pieces-framework';
import { jumpcloudAuth } from '../auth';
import { jumpcloudObjects } from '../common/objects';
import { jumpcloudOutput } from '../common/output';
import { jumpcloudProps } from '../common/props';

export const getObjectAction = createAction({
    auth: jumpcloudAuth,
    name: 'get_object',
    classification: 'READ',
    displayName: 'Get Object by ID',
    description: 'Get a user, device, group or application, with its main fields and the full JumpCloud record.',
    audience: 'both',
    aiMetadata: {
        description:
            'Fetches one JumpCloud user, system (device), user group, device group or SSO application by its ID and returns its main fields plus the complete JumpCloud record under raw. Use List Objects by ID for several IDs at once, or Search Objects when you only know a name or attribute. Safe to retry.',
        idempotent: true,
    },
    props: {
        objectType: jumpcloudProps.objectType(),
        objectId: jumpcloudProps.objectId(),
    },
    async run(context) {
        const type = jumpcloudObjects.parseType(context.propsValue.objectType);
        const record = await jumpcloudObjects.getRecord({ auth: context.auth.props, type, id: context.propsValue.objectId });
        return { ...jumpcloudOutput.flatten({ type, record }), raw: record };
    },
});
