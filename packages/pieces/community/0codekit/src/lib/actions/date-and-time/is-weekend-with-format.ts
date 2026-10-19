import { createAction, Property } from '@activepieces/pieces-framework';
import { zeroCodeKitAuth } from '../../auth';
import { dateAndTimeApi } from '../../common/date-and-time';
import { dateInput } from '../../common/date-input';
import { zeroCodeKitProps } from '../../common/props';
import { dateConvertSchemas } from '../../common/output-schemas/date-convert';

export const isWeekendWithFormatAction = createAction({
    auth: zeroCodeKitAuth,
    name: 'is_weekend_with_format',
    classification: 'READ',
    displayName: 'Is Given Date is Weekend, with Format',
    description: 'Check whether a date written in a custom format falls on a weekend, and get its weekday.',
    audience: 'both',
    aiMetadata: {
        description:
            'Check whether a date is on a weekend and return its weekday name and number, parsing the date with the given Date Format (for example DD.MM.YYYY). Use "Is Given Date is Weekend" for standard ISO dates. Read-only and safe to retry.',
        idempotent: true,
    },
    props: {
        date: Property.ShortText({
            displayName: 'Date',
            description: 'The date to check, written in the format below.',
            required: true,
            placeholder: '20.01.2025',
        }),
        dateFormat: zeroCodeKitProps.dateFormat({
            displayName: 'Date Format',
            description:
                'How the date above is written, using `YYYY` or `YY` (year), `MM` or `M` (month) and `DD` or `D` (day), with any separators. For example `DD.MM.YYYY` for 20.01.2025.',
            required: true,
        }),
        timeZone: zeroCodeKitProps.timeZone({
            displayName: 'Time Zone',
            description: 'The time zone the date belongs to. Leave empty to use the 0CodeKit default.',
            required: false,
        }),
    },
    outputSchema: dateConvertSchemas.isWeekend,
    async run({ auth, propsValue }) {
        return dateAndTimeApi.isWeekend({
            apiKey: auth.secret_text,
            body: {
                date: dateInput.toIsoDate({ date: propsValue.date, format: propsValue.dateFormat ?? '' }),
                timeZone: propsValue.timeZone,
            },
        });
    },
});
