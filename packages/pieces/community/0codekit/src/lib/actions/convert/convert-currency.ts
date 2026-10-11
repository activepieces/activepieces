import { createAction, Property } from '@activepieces/pieces-framework';
import { zeroCodeKitAuth } from '../../auth';
import { zeroCodeKitApi } from '../../common/client';
import { dateConvertSchemas } from '../../common/output-schemas/date-convert';

export const convertCurrencyAction = createAction({
    auth: zeroCodeKitAuth,
    name: 'convert_currency',
    classification: 'READ',
    displayName: 'Convert Currency',
    description: 'Convert an amount from one currency to another at the latest exchange rate.',
    audience: 'both',
    aiMetadata: {
        description:
            'Convert an amount between two currencies given as ISO 4217 codes (USD, EUR, GBP) using the most recent exchange rate 0CodeKit has, and return the date of that rate. Read-only and safe to retry, though the rate can change between calls.',
        idempotent: true,
    },
    props: {
        amount: Property.Number({
            displayName: 'Amount',
            description: 'The amount to convert.',
            required: true,
        }),
        sourceCurrency: Property.ShortText({
            displayName: 'From Currency',
            description: 'The three-letter currency code of the amount, for example `USD`.',
            required: true,
            placeholder: 'USD',
        }),
        targetCurrency: Property.ShortText({
            displayName: 'To Currency',
            description: 'The three-letter currency code to convert to, for example `EUR`.',
            required: true,
            placeholder: 'EUR',
        }),
        dateFormat: Property.ShortText({
            displayName: 'Rate Date Format',
            description: 'How the rate date is written, using `DD`, `MM` and `YYYY` tokens.',
            required: false,
            placeholder: 'DD.MM.YYYY',
        }),
    },
    outputSchema: dateConvertSchemas.currency,
    async run({ auth, propsValue }) {
        const response = await zeroCodeKitApi.post<CurrencyResponse>({
            apiKey: auth.secret_text,
            path: '/convert/currency',
            body: {
                amount: propsValue.amount,
                sourceCurrency: propsValue.sourceCurrency.trim().toUpperCase(),
                targetCurrency: propsValue.targetCurrency.trim().toUpperCase(),
                dateFormat: propsValue.dateFormat,
            },
        });
        return {
            converted_amount: response.convertedAmount ?? null,
            converted_currency: response.currency ?? null,
            original_amount: response.oldAmount ?? null,
            original_currency: response.oldCurrency ?? null,
            rate_date: response.dataDate ?? null,
        };
    },
});

type CurrencyResponse = {
    oldAmount?: number;
    oldCurrency?: string;
    convertedAmount?: number;
    currency?: string;
    dataDate?: string;
};
