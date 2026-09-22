import { createAction, Property } from '@activepieces/pieces-framework';
import { createClient } from '@supabase/supabase-js';
import { supabaseAuth } from '../auth';
import { createUserActionOutputSchema } from '../output-schemas';

export const createUser = createAction({
    name: 'create_user',
    classification: 'WRITE',
    displayName: 'Create User',
    description: 'Creates a new user directly in the project\'s Auth system, with an immediately usable password. Requires the Service Role Key.',
    audience: 'both',
    aiMetadata: {
        description: 'Creates a new user in Auth with an email/phone and password that can sign in immediately, skipping the invite/confirmation email flow. Requires the Service Role Key. Use for programmatic account provisioning; use Invite User by Email instead if the user should set their own password via an email link. Not idempotent: calling twice with the same email creates a conflict error, not a second identical user.',
        idempotent: false,
    },
    auth: supabaseAuth,
    props: {
        email: Property.ShortText({
            displayName: 'Email',
            required: false,
        }),
        phone: Property.ShortText({
            displayName: 'Phone',
            required: false,
        }),
        password: Property.ShortText({
            displayName: 'Password',
            required: false,
        }),
        emailConfirm: Property.Checkbox({
            displayName: 'Mark Email as Confirmed',
            required: false,
            defaultValue: false,
        }),
        userMetadata: Property.Json({
            displayName: 'User Metadata',
            description: 'Custom data to attach to the user, as a JSON object.',
            required: false,
        }),
    },
    outputSchema: createUserActionOutputSchema,
    async run(context) {
        const { email, phone, password, emailConfirm, userMetadata } = context.propsValue;
        const { url, apiKey } = context.auth.props;
        const supabase = createClient(url, apiKey);

        if (!email && !phone) {
            throw new Error('Either Email or Phone must be provided.');
        }

        const { data, error } = await supabase.auth.admin.createUser({
            email,
            phone,
            password,
            email_confirm: emailConfirm,
            user_metadata: (userMetadata as Record<string, unknown>) ?? undefined,
        });

        if (error) {
            throw new Error(`Failed to create user: ${error.message}`);
        }

        return {
            id: data.user.id,
            email: data.user.email ?? null,
            phone: data.user.phone ?? null,
            created_at: data.user.created_at,
        };
    },
});
