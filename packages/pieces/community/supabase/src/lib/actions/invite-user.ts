import { createAction, Property } from '@activepieces/pieces-framework';
import { createClient } from '@supabase/supabase-js';
import { supabaseAuth } from '../auth';
import { inviteUserActionOutputSchema } from '../output-schemas';

export const inviteUser = createAction({
    name: 'invite_user',
    classification: 'WRITE',
    displayName: 'Invite User by Email',
    description: 'Sends an invite email to a new user, who sets their own password when accepting. Requires the Service Role Key.',
    audience: 'both',
    aiMetadata: {
        description: 'Creates a new user and sends them an invite email with a link to set their own password. Requires the Service Role Key. Use for user-facing onboarding; use Create User instead when you need to provision a login programmatically without an email step. Not idempotent: calling twice for the same email errors on the second call once the account exists.',
        idempotent: false,
    },
    auth: supabaseAuth,
    props: {
        email: Property.ShortText({
            displayName: 'Email',
            required: true,
        }),
        userMetadata: Property.Json({
            displayName: 'User Metadata',
            description: 'Custom data to attach to the user, as a JSON object.',
            required: false,
        }),
        redirectTo: Property.ShortText({
            displayName: 'Redirect URL',
            description: 'Where to redirect the user after they accept the invite.',
            required: false,
        }),
    },
    outputSchema: inviteUserActionOutputSchema,
    async run(context) {
        const { email, userMetadata, redirectTo } = context.propsValue;
        const { url, apiKey } = context.auth.props;
        const supabase = createClient(url, apiKey);

        const { data, error } = await supabase.auth.admin.inviteUserByEmail(email, {
            data: (userMetadata as Record<string, unknown>) ?? undefined,
            redirectTo,
        });

        if (error) {
            throw new Error(`Failed to invite user: ${error.message}`);
        }

        return {
            id: data.user.id,
            email: data.user.email ?? null,
            invited_at: data.user.invited_at ?? null,
        };
    },
});
