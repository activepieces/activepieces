import { createAction, Property } from '@activepieces/pieces-framework';
import { zeroCodeKitAuth } from '../../auth';
import { zeroCodeKitApi } from '../../common/client';
import { businessAiOutputSchemas } from '../../common/output-schemas/business-ai';

export const validateIbanAction = createAction({
    auth: zeroCodeKitAuth,
    name: 'validate_iban',
    classification: 'READ',
    displayName: 'Validate an IBAN',
    description: 'Check whether an IBAN bank account number is valid.',
    audience: 'both',
    aiMetadata: {
        description:
            'Check whether an IBAN (International Bank Account Number) is valid. Returns only a true/false result. Read-only and safe to retry.',
        idempotent: true,
    },
    props: {
        iban: Property.ShortText({
            displayName: 'IBAN',
            description: 'The IBAN to check.',
            required: true,
            placeholder: 'DE02120300000000202051',
        }),
    },
    outputSchema: businessAiOutputSchemas.validateIban,
    async run({ auth, propsValue }) {
        const response = await zeroCodeKitApi.post<ValidityResponse>({
            apiKey: auth.secret_text,
            path: '/business/validate/iban',
            body: { iban: propsValue.iban.trim() },
        });
        return { valid: response.valid ?? null };
    },
});

type ValidityResponse = {
    valid?: boolean;
};
