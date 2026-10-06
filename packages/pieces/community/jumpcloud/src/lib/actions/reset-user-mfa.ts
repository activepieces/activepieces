import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { jumpcloudAuth } from '../auth';
import { jumpcloudApi } from '../common/client';
import { jumpcloudObjects } from '../common/objects';
import { jumpcloudProps } from '../common/props';
import { resetMfaOutputSchema } from '../output-schemas';

export const resetUserMfaAction = createAction({
    auth: jumpcloudAuth,
    name: 'reset_user_mfa',
    classification: 'WRITE',
    displayName: 'Reset User MFA',
    description: 'Clear the multi-factor authentication enrollment of a user so they set it up again, for example after losing their phone.',
    audience: 'both',
    aiMetadata: {
        description:
            "Resets a JumpCloud user's MFA (TOTP) enrollment so they must enroll again, optionally with a grace period of days during which they can sign in without MFA. Each call resets again, which forces the user to re-enroll if they already did.",
        idempotent: false,
    },
    props: {
        userId: jumpcloudProps.objectId({ displayName: 'User', fixedType: 'user' }),
        allowGracePeriod: Property.Checkbox({
            displayName: 'Allow Sign-in Without MFA for a While',
            description: 'Lets the user sign in without MFA until they enroll again, for the number of days below.',
            required: false,
            defaultValue: false,
            reveals: ['gracePeriodDays'],
        }),
        gracePeriodDays: Property.Number({
            displayName: 'Grace Period (days)',
            description: 'How many days the user can sign in without MFA, from 1 to 365.',
            required: false,
            defaultValue: 7,
        }),
    },
    outputSchema: resetMfaOutputSchema,
    async run(context) {
        const { allowGracePeriod, gracePeriodDays } = context.propsValue;
        const userId = context.propsValue.userId.trim();
        const days = allowGracePeriod === true ? validateDays(gracePeriodDays) : null;
        await jumpcloudApi.send<unknown>({
            auth: context.auth.props,
            method: HttpMethod.POST,
            path: `${jumpcloudObjects.itemPath({ type: 'user', id: userId })}/resetmfa`,
            body: days === null ? { exclusion: false } : { exclusion: true, exclusionDays: days },
        });
        return { user_id: userId, mfa_reset: true, grace_period_days: days };
    },
});

function validateDays(value: number | undefined): number {
    if (value === undefined || !Number.isInteger(value) || value < 1 || value > 365) {
        throw new Error('Grace Period must be a whole number of days from 1 to 365.');
    }
    return value;
}
