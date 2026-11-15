import { createAction, Property } from '@activepieces/pieces-framework';
import { zeroCodeKitAuth } from '../../auth';
import { dateAndTimeApi } from '../../common/date-and-time';
import { zeroCodeKitProps } from '../../common/props';
import { dateConvertSchemas } from '../../common/output-schemas/date-convert';

export const specificMonthAndYearAction = createAction({
    auth: zeroCodeKitAuth,
    name: 'specific_month_and_year',
    classification: 'READ',
    displayName: 'Specific Month and Year',
    description: 'Get the days, workdays, Saturdays and Sundays of a chosen month.',
    audience: 'both',
    aiMetadata: {
        description:
            'Return the number of days, first and last day, last workday, and the lists of workdays, Saturdays and Sundays for a given month and year. Use Current Month when you only need the month that is current now. Read-only and safe to retry.',
        idempotent: true,
    },
    props: {
        month: Property.StaticDropdown({
            displayName: 'Month',
            description: 'The month to describe.',
            required: true,
            options: {
                options: monthOptions(),
            },
        }),
        year: Property.Number({
            displayName: 'Year',
            description: 'The four-digit year, for example 2025.',
            required: true,
        }),
        outputFormat: zeroCodeKitProps.outputFormat(),
        returnTimestamps: zeroCodeKitProps.returnTimestamps(),
    },
    outputSchema: dateConvertSchemas.month,
    async run({ auth, propsValue }) {
        return dateAndTimeApi.month({
            apiKey: auth.secret_text,
            body: {
                month: propsValue.month,
                year: propsValue.year,
                outputFormat: propsValue.outputFormat,
                options: dateAndTimeApi.monthOptions({ returnTimestamps: propsValue.returnTimestamps }),
            },
        });
    },
});

function monthOptions() {
    return [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December',
    ].map((name, index) => ({ label: name, value: index + 1 }));
}
