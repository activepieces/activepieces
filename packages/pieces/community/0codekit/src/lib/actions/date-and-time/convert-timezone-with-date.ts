import { createAction, Property } from '@activepieces/pieces-framework';
import { zeroCodeKitAuth } from '../../auth';
import { dateAndTimeApi } from '../../common/date-and-time';
import { zeroCodeKitProps } from '../../common/props';
import { dateConvertSchemas } from '../../common/output-schemas/date-convert';

export const convertTimezoneWithDateAction = createAction({
    auth: zeroCodeKitAuth,
    name: 'convert_timezone_with_date',
    classification: 'READ',
    displayName: 'Convert Between Timezones with Date',
    description: 'Convert a date and time from one time zone to another.',
    audience: 'both',
    aiMetadata: {
        description:
            'Convert a date and time written as text from a source time zone to a destination time zone, optionally reformatting it. Use "Convert Between Timezones with Unix Timestamp" when the input is a numeric timestamp. Read-only and safe to retry.',
        idempotent: true,
    },
    props: {
        inputTime: Property.ShortText({
            displayName: 'Date and Time',
            description: 'The date and time to convert, for example `2025-01-20 14:30`.',
            required: true,
            placeholder: '2025-01-20 14:30',
        }),
        inputTimeZone: zeroCodeKitProps.timeZone({
            displayName: 'From Time Zone',
            description: 'The time zone the date and time above is in.',
            required: true,
        }),
        destinationTimeZone: zeroCodeKitProps.timeZone({
            displayName: 'To Time Zone',
            description: 'The time zone to convert to.',
            required: true,
        }),
        formatPattern: zeroCodeKitProps.dateFormat({
            displayName: 'Output Format',
            description:
                'How the converted time is written, using tokens such as `DD.MM.YYYY HH:mm`. Leave empty to use the 0CodeKit default.',
            required: false,
        }),
    },
    outputSchema: dateConvertSchemas.switchTimeZone,
    async run({ auth, propsValue }) {
        return dateAndTimeApi.switchTimeZone({
            apiKey: auth.secret_text,
            body: {
                inputTime: propsValue.inputTime,
                inputTimeZone: propsValue.inputTimeZone,
                destinationTimeZone: propsValue.destinationTimeZone,
                formatPattern: propsValue.formatPattern,
            },
        });
    },
});
