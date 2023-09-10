import { Property, createAction } from '@activepieces/pieces-framework';
import { ChangeDateFormat, OptionalTimeFormats, TimeFormat, action_description, timezoneOptions } from '../common';

export const formatDateAction = createAction({
    name: 'format_date',
    displayName: 'Format Date',
    description: 'Format a date by changing its format',
    props: {
        InputDate: Property.ShortText({
            displayName: 'Input Date',
            description: 'Enter the input date',
            required: true,
            defaultValue: ''
        }),
        InputFormat: Property.StaticDropdown({
            displayName: 'From Time Format',
            description: action_description,
            options: {
                options: OptionalTimeFormats,
            },
            required: true,
            defaultValue: TimeFormat.format00
        }),
        InputTimeZone: Property.StaticDropdown<string>({
            displayName: "From Timezone",
            options: {
                options: timezoneOptions,
            },
            required: true,
            defaultValue: "UTC"
        }),
        OutputFormat: Property.StaticDropdown({
            displayName: 'To Time Format',
            description: action_description,
            options: {
                options: OptionalTimeFormats,
            },
            required: true,
            defaultValue: TimeFormat.format00
        }),
        OutputTimeZone: Property.StaticDropdown<string>({
            displayName: "To Timezone",
            options: {
                options: timezoneOptions,
            },
            required: true,
            defaultValue: "UTC"
        }),
    },
    async run(context) {
        const inputDate = context.propsValue.InputDate as string;
        const inputFormat = context.propsValue.InputFormat as string;
        const inputTimeZone = context.propsValue.InputTimeZone as string;
        const outputFormat = context.propsValue.OutputFormat as string;
        const outputTimeZone = context.propsValue.OutputTimeZone as string;
        
        return { result: ChangeDateFormat( inputDate , inputFormat , inputTimeZone , outputFormat , outputTimeZone ) };
    }
})