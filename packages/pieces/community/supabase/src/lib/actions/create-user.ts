import { createAction, MarkdownVariant, Property } from '@activepieces/pieces-framework';
import { createClient } from '@supabase/supabase-js';
import { supabaseAuth } from '../auth';
import { createUserActionOutputSchema } from '../output-schemas';

export const createUser = createAction({
    name: 'create_user',
    classification: 'WRITE',
    displayName: 'Create User',
    description: 'Creates a user in Supabase Auth. Requires the Service Role Key.',
    audience: 'both',
    aiMetadata: {
        description: 'Creates a new user in Auth with an email/phone and password that can sign in immediately, skipping the invite/confirmation email flow. Requires the Service Role Key. Use for programmatic account provisioning; use Invite User by Email instead if the user should set their own password via an email link. Not idempotent: calling twice with the same email creates a conflict error, not a second identical user.',
        idempotent: false,
    },
    auth: supabaseAuth,
    props: {
        contact_info: Property.MarkDown({
            value: 'Enter an email, a phone number, or both.',
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
            description: 'Leave empty for passwordless sign-in.',
            required: false,
        }),
        emailConfirm: Property.Checkbox({
            displayName: 'Mark Email as Confirmed',
            description: 'Lets the user sign in without confirming by email.',
            required: false,
            defaultValue: false,
        }),
        userMetadata: Property.Json({
            displayName: 'User Metadata',
            description: 'Custom data saved on the user, as JSON.',
            required: false,
        }),
    },
    propertyGroups: [
        {
            key: 'signin',
            display: 'section',
            label: 'Sign-in Details',
            icon: 'user',
            props: ['contact_info', 'email', 'phone', 'password'],
        },
        {
            key: 'options',
            display: 'section',
            label: 'Options',
            icon: 'sliders',
            props: ['emailConfirm', 'userMetadata'],
        },
    ],
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
