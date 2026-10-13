import { createAction, Property } from '@activepieces/pieces-framework';
import { zeroCodeKitAuth } from '../../auth';
import { dateAndTimeApi } from '../../common/date-and-time';
import { dateInput } from '../../common/date-input';
import { zeroCodeKitProps } from '../../common/props';
import { dateConvertSchemas } from '../../common/output-schemas/date-convert';

export const currentWeekWithWeekNumberAction = createAction({
    auth: zeroCodeKitAuth,
    name: 'current_week_with_week_number',
    classification: 'READ',
    displayName: 'Current Week only with Week Number',
    description: 'Get the first and last day of a calendar week in the current year.',
    audience: 'both',
    aiMetadata: {
        description:
            'Return the first and last day of a calendar week number in the current year. Use "Current Week with Week Number and Year" to pick a different year. Read-only and safe to retry.',
        idempotent: true,
    },
    props: {
        weekNumber: Property.Number({
            displayName: 'Week Number',
            description: 'The calendar week number, from 1 to 53.',
            required: true,
        }),
        outputFormat: zeroCodeKitProps.outputFormat(),
    },
    outputSchema: dateConvertSchemas.calendarWeek,
    async run({ auth, propsValue }) {
        return dateAndTimeApi.calendarWeek({
            apiKey: auth.secret_text,
            body: {
                date: dateInput.isoWeekMonday({ weekNumber: propsValue.weekNumber, year: new Date().getUTCFullYear() }),
                dateFormat: 'DD.MM.YYYY',
                outputFormat: propsValue.outputFormat,
            },
        });
    },
});
