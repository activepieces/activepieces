import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { jumpcloudAuth } from '../auth';
import { jumpcloudApi } from '../common/client';
import { jumpcloudObjects } from '../common/objects';
import { jumpcloudOutput } from '../common/output';
import { jumpcloudProps } from '../common/props';
import { userOutputSchema } from '../output-schemas';

export const lockUserAction = createAction({
    auth: jumpcloudAuth,
    name: 'lock_user',
    classification: 'WRITE',
    displayName: 'Lock User',
    description: 'Lock a user so they cannot sign in to JumpCloud, their devices or connected applications until unlocked.',
    audience: 'both',
    aiMetadata: {
        description:
            'Locks a JumpCloud user account (account_locked=true), blocking sign-in everywhere JumpCloud authenticates them, and returns the user. Reversible with Unlock User; prefer it over Delete Object to cut access temporarily. Safe to retry.',
        idempotent: true,
    },
    props: {
        userId: jumpcloudProps.objectId({ displayName: 'User', fixedType: 'user' }),
    },
    outputSchema: userOutputSchema,
    async run(context) {
        const user = await jumpcloudApi.send<unknown>({
            auth: context.auth.props,
            method: HttpMethod.PUT,
            path: jumpcloudObjects.itemPath({ type: 'user', id: context.propsValue.userId }),
            body: { account_locked: true },
        });
        if (!jumpcloudApi.isRecord(user)) {
            throw new Error('JumpCloud did not return the locked user.');
        }
        return jumpcloudOutput.flatten({ type: 'user', record: user });
    },
});
