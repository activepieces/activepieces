import { Property, createAction } from '@activepieces/pieces-framework';
import { optionalTimeFormats, timeFormat, timeFormatDescription, createNewDate } from '../common';

export const getCurrentDate = createAction({
    name: 'get_current_date',
    displayName: 'Get Current Date',
    description: 'Get the current date',
    props: {
        timeFormat: Property.StaticDropdown({
            displayName: 'To Time Format',
            description: timeFormatDescription,
            options: {
                options: optionalTimeFormats
            },
            required: true,
            defaultValue: timeFormat.format00
        }),
    },
    async run(context) {
        const timeFormat = context.propsValue.timeFormat;
        const date = new Date();
        return { result: createNewDate( date , timeFormat ) };
    }
})