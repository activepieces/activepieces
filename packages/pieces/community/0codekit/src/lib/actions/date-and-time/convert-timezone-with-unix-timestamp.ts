import { createAction, Property } from '@activepieces/pieces-framework';
import { zeroCodeKitAuth } from '../../auth';
import { dateAndTimeApi } from '../../common/date-and-time';
import { zeroCodeKitProps } from '../../common/props';
import { dateConvertSchemas } from '../../common/output-schemas/date-convert';

export const convertTimezoneWithUnixTimestampAction = createAction({
    auth: zeroCodeKitAuth,
    name: 'convert_timezone_with_unix_timestamp',
    classification: 'READ',
    displayName: 'Convert Between Timezones with Unix Timestamp',
    description: 'Show a Unix timestamp as a date and time in another time zone.',
    audience: 'both',
    aiMetadata: {
        description:
            'Convert a Unix timestamp in seconds into a formatted date and time in the destination time zone. Use "Convert Between Timezones with Date" when the input is a date written as text. Read-only and safe to retry.',
        idempotent: true,
    },
    props: {
        inputTime: Property.Number({
            displayName: 'Unix Timestamp',
            description: 'The moment to convert, in seconds since 1 January 1970.',
            required: true,
            placeholder: '1737331200',
        }),
        inputTimeZone: zeroCodeKitProps.timeZone({
            displayName: 'From Time Zone',
            description: 'The time zone of the timestamp. Unix timestamps are normally UTC.',
            required: false,
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
                inputTimeZone: propsValue.inputTimeZone ?? 'UTC',
                destinationTimeZone: propsValue.destinationTimeZone,
                formatPattern: propsValue.formatPattern,
            },
        });
    },
});
