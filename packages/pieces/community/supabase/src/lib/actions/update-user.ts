import { createAction, MarkdownVariant, Property } from '@activepieces/pieces-framework';
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
            description: 'Find it under Authentication, Users in Supabase.',
            placeholder: '00000000-0000-0000-0000-000000000000',
            required: true,
        }),
        changes_info: Property.MarkDown({
            value: 'Empty email, phone and password keep their current value.',
            variant: MarkdownVariant.INFO,
        }),
        email: Property.ShortText({
            displayName: 'Email',
            placeholder: 'jane@example.com',
            required: false,
            width: 'half',
        }),
        phone: Property.ShortText({
            displayName: 'Phone',
            description: 'Include the country code.',
            placeholder: '+15551234567',
            required: false,
            width: 'half',
        }),
        password: Property.ShortText({
            displayName: 'Password',
            description: 'Leave empty to keep the current password.',
            required: false,
        }),
        userMetadata: Property.Json({
            displayName: 'User Metadata',
            description: 'Custom data saved on the user, as JSON.',
            required: false,
        }),
    },
    propertyGroups: [
        {
            key: 'user',
            display: 'section',
            label: 'User to Update',
            icon: 'user',
            props: ['userId'],
        },
        {
            key: 'changes',
            display: 'section',
            label: 'Changes',
            icon: 'text',
            props: ['changes_info', 'email', 'phone', 'password', 'userMetadata'],
        },
    ],
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
