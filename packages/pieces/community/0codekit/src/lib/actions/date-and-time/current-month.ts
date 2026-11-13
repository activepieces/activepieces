import { createAction } from '@activepieces/pieces-framework';
import { zeroCodeKitAuth } from '../../auth';
import { dateAndTimeApi } from '../../common/date-and-time';
import { zeroCodeKitProps } from '../../common/props';
import { dateConvertSchemas } from '../../common/output-schemas/date-convert';

export const currentMonthAction = createAction({
    auth: zeroCodeKitAuth,
    name: 'current_month',
    classification: 'READ',
    displayName: 'Current Month',
    description: 'Get the days, workdays, Saturdays and Sundays of the current month.',
    audience: 'both',
    aiMetadata: {
        description:
            'Return the number of days, first and last day, last workday, and the lists of workdays, Saturdays and Sundays for the month that is current right now. Use Specific Month and Year for any other month. Read-only and safe to retry.',
        idempotent: true,
    },
    props: {
        outputFormat: zeroCodeKitProps.outputFormat(),
        returnTimestamps: zeroCodeKitProps.returnTimestamps(),
    },
    outputSchema: dateConvertSchemas.month,
    async run({ auth, propsValue }) {
        return dateAndTimeApi.month({
            apiKey: auth.secret_text,
            body: {
                outputFormat: propsValue.outputFormat,
                options: dateAndTimeApi.monthOptions({ returnTimestamps: propsValue.returnTimestamps }),
            },
        });
    },
});
