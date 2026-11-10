import { createAction, Property } from '@activepieces/pieces-framework';
import { zeroCodeKitAuth } from '../../auth';
import { dateAndTimeApi } from '../../common/date-and-time';
import { dateInput } from '../../common/date-input';
import { zeroCodeKitProps } from '../../common/props';
import { dateConvertSchemas } from '../../common/output-schemas/date-convert';

export const currentWeekWithWeekNumberAndYearAction = createAction({
    auth: zeroCodeKitAuth,
    name: 'current_week_with_week_number_and_year',
    classification: 'READ',
    displayName: 'Current Week with Week Number and Year',
    description: 'Get the first and last day of a calendar week in a chosen year.',
    audience: 'both',
    aiMetadata: {
        description:
            'Return the first and last day of a calendar week number in a given year. Use "Current Week only with Week Number" when the year is the current one. Read-only and safe to retry.',
        idempotent: true,
    },
    props: {
        weekNumber: Property.Number({
            displayName: 'Week Number',
            description: 'The calendar week number, from 1 to 53.',
            required: true,
        }),
        year: Property.Number({
            displayName: 'Year',
            description: 'The four-digit year, for example 2025.',
            required: true,
        }),
        outputFormat: zeroCodeKitProps.outputFormat(),
    },
    outputSchema: dateConvertSchemas.calendarWeek,
    async run({ auth, propsValue }) {
        return dateAndTimeApi.calendarWeek({
            apiKey: auth.secret_text,
            body: {
                date: dateInput.isoWeekMonday({ weekNumber: propsValue.weekNumber, year: propsValue.year }),
                dateFormat: 'DD.MM.YYYY',
                outputFormat: propsValue.outputFormat,
            },
        });
    },
});
