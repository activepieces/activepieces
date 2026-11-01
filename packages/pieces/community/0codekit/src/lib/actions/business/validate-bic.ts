import { createAction, Property } from '@activepieces/pieces-framework';
import { zeroCodeKitAuth } from '../../auth';
import { zeroCodeKitApi } from '../../common/client';
import { businessAiOutputSchemas } from '../../common/output-schemas/business-ai';

export const validateBicAction = createAction({
    auth: zeroCodeKitAuth,
    name: 'validate_bic',
    classification: 'READ',
    displayName: 'Validate a bic',
    description: 'Check whether a BIC (SWIFT code) is valid.',
    audience: 'both',
    aiMetadata: {
        description:
            'Check whether a BIC / SWIFT bank identifier code (8 or 11 characters) is valid. Returns only a true/false result. Read-only and safe to retry.',
        idempotent: true,
    },
    props: {
        bic: Property.ShortText({
            displayName: 'BIC',
            description: 'The BIC or SWIFT code to check.',
            required: true,
            placeholder: 'DEUTDEFF',
        }),
    },
    outputSchema: businessAiOutputSchemas.validateBic,
    async run({ auth, propsValue }) {
        const response = await zeroCodeKitApi.post<ValidityResponse>({
            apiKey: auth.secret_text,
            path: '/business/validate/bic',
            body: { bic: propsValue.bic.trim() },
        });
        return { valid: response.valid ?? null };
    },
});

type ValidityResponse = {
    valid?: boolean;
};
