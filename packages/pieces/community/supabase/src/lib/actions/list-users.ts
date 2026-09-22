import { createAction, Property } from '@activepieces/pieces-framework';
import { createClient } from '@supabase/supabase-js';
import { supabaseAuth } from '../auth';
import { listUsersActionOutputSchema } from '../output-schemas';

export const listUsers = createAction({
    name: 'list_users',
    classification: 'SEARCH',
    displayName: 'List Users',
    description: 'Lists the users registered in the project\'s Auth system. Requires the Service Role Key.',
    audience: 'both',
    aiMetadata: {
        description: "Lists users registered in the connected Supabase project's Auth system, paginated. Requires the Service Role Key. Use to look up or browse accounts before acting on a specific user. Read-only and idempotent.",
        idempotent: true,
    },
    auth: supabaseAuth,
    props: {
        page: Property.Number({
            displayName: 'Page',
            description: 'Page number for pagination (starts from 1).',
            required: false,
            defaultValue: 1,
        }),
        perPage: Property.Number({
            displayName: 'Users Per Page',
            required: false,
            defaultValue: 50,
        }),
    },
    outputSchema: listUsersActionOutputSchema,
    async run(context) {
        const { page, perPage } = context.propsValue;
        const { url, apiKey } = context.auth.props;
        const supabase = createClient(url, apiKey);

        const { data, error } = await supabase.auth.admin.listUsers({
            page: page || 1,
            perPage: perPage || 50,
        });

        if (error) {
            throw new Error(`Failed to list users: ${error.message}`);
        }

        return {
            users: data.users.map((user) => ({
                id: user.id,
                email: user.email ?? null,
                phone: user.phone ?? null,
                created_at: user.created_at,
                last_sign_in_at: user.last_sign_in_at ?? null,
                confirmed_at: user.confirmed_at ?? null,
            })),
        };
    },
});
