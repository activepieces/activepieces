import { createAction, Property } from '@activepieces/pieces-framework';
import { zeroCodeKitAuth } from '../../auth';
import { dateAndTimeApi } from '../../common/date-and-time';
import { zeroCodeKitProps } from '../../common/props';
import { dateConvertSchemas } from '../../common/output-schemas/date-convert';

export const currentWeekFromUnixTimestampAction = createAction({
    auth: zeroCodeKitAuth,
    name: 'current_week_from_unix_timestamp',
    classification: 'READ',
    displayName: 'Current Week from Unix Timestamp',
    description: 'Get the calendar week number and the first and last day of the week a Unix timestamp falls in.',
    audience: 'both',
    aiMetadata: {
        description:
            'Return the calendar week number of a Unix timestamp in seconds, plus the first and last day of that week. Use "Current Week from Date" when the date is text. Read-only and safe to retry.',
        idempotent: true,
    },
    props: {
        unixTimestamp: Property.Number({
            displayName: 'Unix Timestamp',
            description: 'The moment to look up, in seconds since 1 January 1970.',
            required: true,
            placeholder: '1737331200',
        }),
        outputFormat: zeroCodeKitProps.outputFormat(),
    },
    outputSchema: dateConvertSchemas.calendarWeek,
    async run({ auth, propsValue }) {
        return dateAndTimeApi.calendarWeek({
            apiKey: auth.secret_text,
            body: {
                unixTimestamp: propsValue.unixTimestamp,
                outputFormat: propsValue.outputFormat,
            },
        });
    },
});
