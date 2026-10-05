import { createAction, Property } from '@activepieces/pieces-framework';
import { createClient } from '@supabase/supabase-js';
import { supabaseAuth } from '../auth';
import { updateUserActionOutputSchema } from '../output-schemas';

export const updateUser = createAction({
    name: 'update_user',
    classification: 'WRITE',
    displayName: 'Update User',
    description: 'Updates a user\'s email, phone, password, or metadata. Requires the Service Role Key.',
    audience: 'both',
    aiMetadata: {
        description: "Updates an existing user's email, phone, password, or metadata by user ID. Requires the Service Role Key. Only the fields provided are changed; leave the rest empty to keep them as-is. Idempotent: setting the same values again has no further effect.",
        idempotent: true,
    },
    auth: supabaseAuth,
    props: {
        userId: Property.ShortText({
            displayName: 'User ID',
            required: true,
        }),
        email: Property.ShortText({
            displayName: 'New Email',
            required: false,
        }),
        phone: Property.ShortText({
            displayName: 'New Phone',
            required: false,
        }),
        password: Property.ShortText({
            displayName: 'New Password',
            required: false,
        }),
        userMetadata: Property.Json({
            displayName: 'User Metadata',
            description: 'Replaces the user\'s custom metadata, as a JSON object.',
            required: false,
        }),
    },
    outputSchema: updateUserActionOutputSchema,
    async run(context) {
        const { userId, email, phone, password, userMetadata } = context.propsValue;
        const { url, apiKey } = context.auth.props;
        const supabase = createClient(url, apiKey);

        const { data, error } = await supabase.auth.admin.updateUserById(userId, {
            email,
            phone,
            password,
            user_metadata: (userMetadata as Record<string, unknown>) ?? undefined,
        });

        if (error) {
            throw new Error(`Failed to update user: ${error.message}`);
        }

        return {
            id: data.user.id,
            email: data.user.email ?? null,
            phone: data.user.phone ?? null,
            updated_at: data.user.updated_at ?? null,
        };
    },
});
