import { createAction, Property } from '@activepieces/pieces-framework';
import { zeroCodeKitAuth } from '../../auth';
import { zeroCodeKitApi } from '../../common/client';
import { dateConvertSchemas } from '../../common/output-schemas/date-convert';

export const getHolidaysAction = createAction({
    auth: zeroCodeKitAuth,
    name: 'get_holidays',
    classification: 'SEARCH',
    displayName: 'Holidays in Specific Country and Year',
    description: 'List the public holidays of a country, and optionally a state, for a year.',
    audience: 'both',
    aiMetadata: {
        description:
            'List public holidays for a country (ISO 3166-1 alpha-2 code) and year, optionally narrowed to a state or region. Returns one row per holiday. Read-only and safe to retry.',
        idempotent: true,
    },
    props: {
        countryCode: Property.ShortText({
            displayName: 'Country Code',
            description: 'The two-letter ISO country code of the country.',
            required: true,
            placeholder: 'DE',
        }),
        year: Property.Number({
            displayName: 'Year',
            description: 'The four-digit year, for example 2025.',
            required: true,
        }),
        state: Property.ShortText({
            displayName: 'State',
            description: 'A state or region code to add regional holidays. Empty: national only.',
            required: false,
            placeholder: 'BY',
        }),
    },
    outputSchema: dateConvertSchemas.holidays,
    async run({ auth, propsValue }) {
        const response = await zeroCodeKitApi.post<HolidaysResponse>({
            apiKey: auth.secret_text,
            path: '/dateandtime/holidays',
            body: {
                year: propsValue.year,
                countryCode: propsValue.countryCode.trim().toUpperCase(),
                state: propsValue.state?.trim(),
            },
        });
        return (response.holidays ?? []).map((holiday) => ({
            name: holiday.name ?? null,
            date: holiday.date ?? null,
            type: holiday.type ?? null,
            start: holiday.start ?? null,
            end: holiday.end ?? null,
            rule: holiday.rule ?? null,
        }));
    },
});

type HolidaysResponse = {
    holidays?: {
        date?: string;
        start?: string;
        end?: string;
        name?: string;
        type?: string;
        rule?: string;
    }[];
};
