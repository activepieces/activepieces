import { createAction } from '@activepieces/pieces-framework';
import { zeroCodeKitAuth } from '../../auth';
import { dateAndTimeApi } from '../../common/date-and-time';
import { zeroCodeKitProps } from '../../common/props';
import { dateConvertSchemas } from '../../common/output-schemas/date-convert';

export const currentWeekAction = createAction({
    auth: zeroCodeKitAuth,
    name: 'current_week',
    classification: 'READ',
    displayName: 'Current Week',
    description: 'Get the calendar week number and the first and last day of the current week.',
    audience: 'both',
    aiMetadata: {
        description:
            'Return the calendar week number of today plus the first and last day of this week. Use the "Current Week from Date" or "from Unix Timestamp" actions for another day. Read-only and safe to retry.',
        idempotent: true,
    },
    props: {
        outputFormat: zeroCodeKitProps.outputFormat(),
    },
    outputSchema: dateConvertSchemas.calendarWeek,
    async run({ auth, propsValue }) {
        return dateAndTimeApi.calendarWeek({
            apiKey: auth.secret_text,
            body: {
                outputFormat: propsValue.outputFormat,
            },
        });
    },
});
