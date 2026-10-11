import { createAction } from '@activepieces/pieces-framework';
import { zeroCodeKitAuth } from '../../auth';
import { randomNameApi } from '../../common/random-name';
import { dateConvertSchemas } from '../../common/output-schemas/date-convert';

export const getRandomNameAction = createAction({
    auth: zeroCodeKitAuth,
    name: 'get_random_name',
    classification: 'READ',
    displayName: 'Get Random Name',
    description: 'Generate a random person name for test data.',
    audience: 'both',
    aiMetadata: {
        description:
            'Generate a random first, middle and last name for mock or test data. Use "Get Random Name with Gender" to force a male or female name. Each call returns a different value and has no side effects.',
        idempotent: true,
    },
    props: {},
    outputSchema: dateConvertSchemas.randomName,
    async run({ auth }) {
        return randomNameApi.generate({
            apiKey: auth.secret_text,
            body: {},
        });
    },
});
