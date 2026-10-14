import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { jumpcloudAuth } from '../auth';
import { jumpcloudApi } from '../common/client';
import { jumpcloudObjects } from '../common/objects';
import { jumpcloudOutput } from '../common/output';
import { jumpcloudProps } from '../common/props';
import { userOutputSchema } from '../output-schemas';

export const unlockUserAction = createAction({
    auth: jumpcloudAuth,
    name: 'unlock_user',
    classification: 'WRITE',
    displayName: 'Unlock User',
    description: 'Unlock a user who was locked by an admin or by too many failed sign-in attempts.',
    audience: 'both',
    aiMetadata: {
        description:
            'Unlocks a JumpCloud user account, whether locked by an admin or by failed sign-ins, and returns the user as it is afterwards. Use Lock User to block access again. Safe to retry.',
        idempotent: true,
    },
    props: {
        userId: jumpcloudProps.objectId({ displayName: 'User', fixedType: 'user' }),
    },
    outputSchema: userOutputSchema,
    async run(context) {
        const auth = context.auth.props;
        const path = jumpcloudObjects.itemPath({ type: 'user', id: context.propsValue.userId });
        await jumpcloudApi.send<unknown>({ auth, method: HttpMethod.POST, path: `${path}/unlock` });
        const user = await jumpcloudObjects.getRecord({ auth, type: 'user', id: context.propsValue.userId });
        return jumpcloudOutput.flatten({ type: 'user', record: user });
    },
});
