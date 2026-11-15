import { createAction } from '@activepieces/pieces-framework';
import { zeroCodeKitAuth } from '../../auth';
import { zeroCodeKitApi } from '../../common/client';
import { dateConvertSchemas } from '../../common/output-schemas/date-convert';

export const getRandomCityAction = createAction({
    auth: zeroCodeKitAuth,
    name: 'get_random_city',
    classification: 'READ',
    displayName: 'Get a Random City',
    description: 'Generate a random, fictional city and country name for test data.',
    audience: 'both',
    aiMetadata: {
        description:
            'Generate a random fictional city name with a country, for mock or test data. Each call returns a different value and has no side effects.',
        idempotent: true,
    },
    props: {},
    outputSchema: dateConvertSchemas.randomCity,
    async run({ auth }) {
        const response = await zeroCodeKitApi.post<RandomCityResponse>({
            apiKey: auth.secret_text,
            path: '/generate/city',
        });
        return {
            city: response.city ?? null,
            country: response.country ?? null,
        };
    },
});

type RandomCityResponse = {
    city?: string;
    country?: string;
};
