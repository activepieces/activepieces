import { createAction, Property } from '@activepieces/pieces-framework';
import { zeroCodeKitAuth } from '../../auth';
import { randomNameApi } from '../../common/random-name';
import { dateConvertSchemas } from '../../common/output-schemas/date-convert';

export const getRandomNameWithGenderAction = createAction({
    auth: zeroCodeKitAuth,
    name: 'get_random_name_with_gender',
    classification: 'READ',
    displayName: 'Get Random Name with Gender',
    description: 'Generate a random male or female person name for test data.',
    audience: 'both',
    aiMetadata: {
        description:
            'Generate a random first, middle and last name of the chosen gender for mock or test data. Use "Get Random Name" when gender does not matter. Each call returns a different value and has no side effects.',
        idempotent: true,
    },
    props: {
        gender: Property.StaticDropdown({
            displayName: 'Gender',
            description: 'The gender of the generated name.',
            required: true,
            defaultValue: 'female',
            options: {
                options: [
                    { label: 'Female', value: 'female' },
                    { label: 'Male', value: 'male' },
                ],
            },
        }),
    },
    outputSchema: dateConvertSchemas.randomName,
    async run({ auth, propsValue }) {
        return randomNameApi.generate({
            apiKey: auth.secret_text,
            body: { gender: propsValue.gender },
        });
    },
});
