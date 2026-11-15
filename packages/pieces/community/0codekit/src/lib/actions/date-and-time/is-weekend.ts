import { createAction, Property } from '@activepieces/pieces-framework';
import { zeroCodeKitAuth } from '../../auth';
import { dateAndTimeApi } from '../../common/date-and-time';
import { zeroCodeKitProps } from '../../common/props';
import { dateConvertSchemas } from '../../common/output-schemas/date-convert';

export const isWeekendAction = createAction({
    auth: zeroCodeKitAuth,
    name: 'is_weekend',
    classification: 'READ',
    displayName: 'Is Given Date is Weekend',
    description: 'Check whether a date falls on a Saturday or Sunday, and get its weekday.',
    audience: 'both',
    aiMetadata: {
        description:
            'Check whether a date is on a weekend and return its weekday name and number. Pass the date in a standard form such as 2025-01-20; use "Is Given Date is Weekend, with Format" when the date is written in a custom format. Read-only and safe to retry.',
        idempotent: true,
    },
    props: {
        date: Property.ShortText({
            displayName: 'Date',
            description: 'The date to check, for example 2025-01-20.',
            required: true,
            placeholder: '2025-01-20',
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
                date: propsValue.date,
                timeZone: propsValue.timeZone,
            },
        });
    },
});
