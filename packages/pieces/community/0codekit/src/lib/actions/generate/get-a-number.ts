import { createAction, Property } from '@activepieces/pieces-framework';
import { zeroCodeKitAuth } from '../../auth';
import { zeroCodeKitApi } from '../../common/client';
import { dateConvertSchemas } from '../../common/output-schemas/date-convert';

export const getANumberAction = createAction({
    auth: zeroCodeKitAuth,
    name: 'get_a_number',
    classification: 'READ',
    displayName: 'Get a Number',
    description: 'Generate a random number between a minimum and a maximum.',
    audience: 'both',
    aiMetadata: {
        description:
            'Generate a random whole or decimal number between a minimum and a maximum, with a chosen number of decimal places for decimals. Each call returns a different value and has no side effects.',
        idempotent: true,
    },
    props: {
        min: Property.Number({
            displayName: 'Minimum',
            description: 'The smallest number that can be returned.',
            required: true,
            defaultValue: 1,
        }),
        max: Property.Number({
            displayName: 'Maximum',
            description: 'The largest number that can be returned.',
            required: true,
            defaultValue: 100,
        }),
        type: Property.StaticDropdown({
            displayName: 'Number Type',
            description: 'Whether to return a whole number or a decimal number.',
            required: true,
            defaultValue: 'integer',
            options: {
                options: [
                    { label: 'Whole number', value: 'integer' },
                    { label: 'Decimal number', value: 'decimal' },
                ],
            },
        }),
        round: Property.Number({
            displayName: 'Decimal Places',
            description: 'Digits after the decimal point. Only used for decimal numbers.',
            required: false,
            defaultValue: 2,
        }),
    },
    outputSchema: dateConvertSchemas.randomNumber,
    async run({ auth, propsValue }) {
        if (propsValue.min > propsValue.max) {
            throw new Error('Minimum must be less than or equal to Maximum.');
        }
        const response = await zeroCodeKitApi.post<RandomNumberResponse>({
            apiKey: auth.secret_text,
            path: '/generate/number',
            body: {
                range: [propsValue.min, propsValue.max],
                type: propsValue.type,
                round: propsValue.type === 'integer' ? undefined : propsValue.round,
            },
        });
        return { number: response.randomNumber ?? null };
    },
});

type RandomNumberResponse = {
    randomNumber?: number;
};
