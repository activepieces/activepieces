import { createAction, Property } from '@activepieces/pieces-framework';
import { createClient } from '@supabase/supabase-js';
import { supabaseAuth } from '../auth';
import { deleteUserActionOutputSchema } from '../output-schemas';

export const deleteUser = createAction({
    name: 'delete_user',
    classification: 'DESTRUCTIVE',
    displayName: 'Delete User',
    description: 'Permanently deletes a user from the project\'s Auth system. Requires the Service Role Key.',
    audience: 'both',
    aiMetadata: {
        description: "Permanently deletes a user from Auth by ID, removing their ability to sign in. Requires the Service Role Key. Use only once you have confirmed the user ID (Get User or List Users first) — this cannot be undone. Idempotent: deleting an already-deleted user ID errors without further effect.",
        idempotent: true,
    },
    auth: supabaseAuth,
    props: {
        userId: Property.ShortText({
            displayName: 'User ID',
            required: true,
        }),
    },
    outputSchema: deleteUserActionOutputSchema,
    async run(context) {
        const { userId } = context.propsValue;
        const { url, apiKey } = context.auth.props;
        const supabase = createClient(url, apiKey);

        const { error } = await supabase.auth.admin.deleteUser(userId);

        if (error) {
            throw new Error(`Failed to delete user: ${error.message}`);
        }

        return {
            success: true,
        };
    },
});
