import { createAction, Property } from '@activepieces/pieces-framework';
import { createClient } from '@supabase/supabase-js';
import { supabaseAuth } from '../auth';
import { getUserActionOutputSchema } from '../output-schemas';

export const getUser = createAction({
    name: 'get_user',
    classification: 'READ',
    displayName: 'Get User',
    description: 'Gets a single user\'s Auth record by ID. Requires the Service Role Key.',
    audience: 'both',
    aiMetadata: {
        description: "Returns a single user's Auth record (email, phone, metadata, confirmation and sign-in timestamps) by user ID. Requires the Service Role Key. Use after List Users to inspect one account in full. Read-only and idempotent.",
        idempotent: true,
    },
    auth: supabaseAuth,
    props: {
        userId: Property.ShortText({
            displayName: 'User ID',
            required: true,
        }),
    },
    outputSchema: getUserActionOutputSchema,
    async run(context) {
        const { userId } = context.propsValue;
        const { url, apiKey } = context.auth.props;
        const supabase = createClient(url, apiKey);

        const { data, error } = await supabase.auth.admin.getUserById(userId);

        if (error) {
            throw new Error(`Failed to get user: ${error.message}`);
        }

        const user = data.user;
        return {
            id: user.id,
            email: user.email ?? null,
            phone: user.phone ?? null,
            user_metadata: user.user_metadata ?? {},
            app_metadata: user.app_metadata ?? {},
            created_at: user.created_at,
            last_sign_in_at: user.last_sign_in_at ?? null,
            confirmed_at: user.confirmed_at ?? null,
        };
    },
});
