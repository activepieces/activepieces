import { createAction, Property } from '@activepieces/pieces-framework';
import { zeroCodeKitAuth } from '../../auth';
import { zeroCodeKitApi } from '../../common/client';
import { businessAiOutputSchemas } from '../../common/output-schemas/business-ai';

export const validateEmailAction = createAction({
    auth: zeroCodeKitAuth,
    name: 'validate_email',
    classification: 'READ',
    displayName: 'Validates an email and correct it',
    description: 'Check whether an email address is valid and get a corrected version of it.',
    audience: 'both',
    aiMetadata: {
        description:
            'Check whether an email address is valid and return a corrected address when a typo can be fixed (for example gmial.com to gmail.com). Does not send any email. Read-only and safe to retry.',
        idempotent: true,
    },
    props: {
        email: Property.ShortText({
            displayName: 'Email',
            description: 'The email address to check.',
            required: true,
            placeholder: 'jane@example.com',
        }),
    },
    outputSchema: businessAiOutputSchemas.validateEmail,
    async run({ auth, propsValue }) {
        const response = await zeroCodeKitApi.post<EmailResponse>({
            apiKey: auth.secret_text,
            path: '/business/validate/email',
            body: { email: propsValue.email.trim() },
        });
        return {
            valid: response.valid ?? null,
            corrected_email: response.emailCorrected ?? null,
        };
    },
});

type EmailResponse = {
    valid?: boolean;
    emailCorrected?: string;
};
