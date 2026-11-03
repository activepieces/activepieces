import { createAction, Property } from '@activepieces/pieces-framework';
import { zeroCodeKitAuth } from '../../auth';
import { dateAndTimeApi } from '../../common/date-and-time';
import { zeroCodeKitProps } from '../../common/props';
import { dateConvertSchemas } from '../../common/output-schemas/date-convert';

export const currentWeekFromDateAction = createAction({
    auth: zeroCodeKitAuth,
    name: 'current_week_from_date',
    classification: 'READ',
    displayName: 'Current Week from Date',
    description: 'Get the calendar week number and the first and last day of the week a date falls in.',
    audience: 'both',
    aiMetadata: {
        description:
            'Return the calendar week number of a date written as text, plus the first and last day of that week. The Date Format must describe how the date is written. Use "Current Week from Unix Timestamp" for numeric timestamps. Read-only and safe to retry.',
        idempotent: true,
    },
    props: {
        date: Property.ShortText({
            displayName: 'Date',
            description: 'The date to look up, written in the format below.',
            required: true,
            placeholder: '20.01.2025',
        }),
        dateFormat: zeroCodeKitProps.dateFormat({
            displayName: 'Date Format',
            description:
                'How the date above is written, using tokens such as `DD` (day), `MM` (month) and `YYYY` (year). For example `DD.MM.YYYY` for 20.01.2025 or `YYYY-MM-DD` for 2025-01-20.',
            required: true,
        }),
        outputFormat: zeroCodeKitProps.outputFormat(),
    },
    outputSchema: dateConvertSchemas.calendarWeek,
    async run({ auth, propsValue }) {
        return dateAndTimeApi.calendarWeek({
            apiKey: auth.secret_text,
            body: {
                date: propsValue.date,
                dateFormat: propsValue.dateFormat,
                outputFormat: propsValue.outputFormat,
            },
        });
    },
});
