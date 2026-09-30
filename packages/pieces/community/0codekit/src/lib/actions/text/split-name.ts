import { createAction, Property } from '@activepieces/pieces-framework';
import { zeroCodeKitAuth } from '../../auth';
import { zeroCodeKitApi } from '../../common/client';
import { businessAiOutputSchemas } from '../../common/output-schemas/business-ai';

export const splitNameAction = createAction({
    auth: zeroCodeKitAuth,
    name: 'split_name',
    classification: 'READ',
    displayName: 'Split Name',
    description: 'Split a full name into first name and last name.',
    audience: 'both',
    aiMetadata: {
        description:
            'Split a full name into first name(s) and last name. Turn on Last Name First for names written family name first, such as many Chinese names. Read-only and safe to retry.',
        idempotent: true,
    },
    props: {
        name: Property.ShortText({
            displayName: 'Full Name',
            description: 'The full name to split.',
            required: true,
            placeholder: 'Jane Mary Doe',
        }),
        reversed: Property.Checkbox({
            displayName: 'Last Name First',
            description: 'Turn on when the name is written with the last name first.',
            required: false,
            defaultValue: false,
        }),
    },
    outputSchema: businessAiOutputSchemas.splitName,
    async run({ auth, propsValue }) {
        const response = await zeroCodeKitApi.post<SplitNameResponse>({
            apiKey: auth.secret_text,
            path: '/operator/splitname',
            body: {
                name: propsValue.name,
                reversed: propsValue.reversed ?? false,
            },
        });
        return {
            first_name: response.firstName ?? null,
            last_name: response.lastName ?? null,
        };
    },
});

type SplitNameResponse = {
    firstName?: string;
    lastName?: string;
};
