import { createAction, Property } from '@activepieces/pieces-framework';
import { zeroCodeKitAuth } from '../../auth';
import { zeroCodeKitApi } from '../../common/client';
import { businessAiOutputSchemas } from '../../common/output-schemas/business-ai';

export const detectGenderAction = createAction({
    auth: zeroCodeKitAuth,
    name: 'detect_gender',
    classification: 'READ',
    displayName: 'Detect Gender',
    description: 'Guess whether a first name is male, female or unisex.',
    audience: 'both',
    aiMetadata: {
        description:
            'Guess the gender (male, female or unisex) most associated with a first name. Accepts a first name or a full name; when both are given the first name wins. Read-only and safe to retry.',
        idempotent: true,
    },
    props: {
        firstName: Property.ShortText({
            displayName: 'First Name',
            description: 'The first name to check. Fill this or Full Name.',
            required: false,
            placeholder: 'Jane',
        }),
        fullName: Property.ShortText({
            displayName: 'Full Name',
            description: 'Used when First Name is empty; its first word is the first name.',
            required: false,
            placeholder: 'Jane Doe',
        }),
    },
    outputSchema: businessAiOutputSchemas.detectGender,
    async run({ auth, propsValue }) {
        const firstName = propsValue.firstName?.trim();
        const fullName = propsValue.fullName?.trim();
        if (!firstName && !fullName) {
            throw new Error('Fill in First Name or Full Name.');
        }
        const response = await zeroCodeKitApi.post<GenderResponse>({
            apiKey: auth.secret_text,
            path: '/operator/gender',
            body: {
                firstname: firstName,
                fullname: fullName,
            },
        });
        return {
            gender: response.detectedGender ?? null,
            first_name: response.firstname ?? null,
            last_name: response.lastname ?? null,
        };
    },
});

type GenderResponse = {
    firstname?: string;
    lastname?: string;
    detectedGender?: string;
};
