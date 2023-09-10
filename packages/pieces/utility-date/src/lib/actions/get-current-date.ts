import { Property, createAction } from '@activepieces/pieces-framework';
import { OptionalTimeFormats, TimeFormat, action_description, createNewDate } from '../common';

export const getCurrentDate = createAction({
    name: 'get_current_date',
    displayName: 'Get Current Date',
    description: 'Get the current date',
    props: {
        TimeFormat: Property.StaticDropdown({
            displayName: 'To Time Format',
            description: action_description,
            options: {
                options: OptionalTimeFormats
            },
            required: true,
            defaultValue: TimeFormat.format00
        }),
    },
    async run(context) {
        const TF = context.propsValue.TimeFormat;
        const date = new Date();
        return { DateNow: createNewDate( date , TF ) };
    }
})