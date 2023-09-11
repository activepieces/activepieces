import { Property, createAction } from '@activepieces/pieces-framework';
import { ChangeDateFormat, optionalTimeFormats, timeFormat, timeFormatDescription, timeZoneOptions } from '../common';

export const formatDateAction = createAction({
    name: 'format_date',
    displayName: 'Format Date',
    description: 'Converts a date from one format to another',
    props: {
        inputDate: Property.ShortText({
            displayName: 'Input Date',
            description: 'Enter the input date',
            required: true,
        }),
        inputFormat: Property.StaticDropdown({
            displayName: 'From Time Format',
            description: timeFormatDescription,
            options: {
                options: optionalTimeFormats,
            },
            required: true,
            defaultValue: timeFormat.format00
        }),
        inputTimeZone: Property.StaticDropdown<string>({
            displayName: "From Time Zone",
            options: {
                options: timeZoneOptions,
            },
            required: true,
            defaultValue: "UTC"
        }),
        outputFormat: Property.StaticDropdown({
            displayName: 'To Time Format',
            description: timeFormatDescription,
            options: {
                options: optionalTimeFormats,
            },
            required: true,
            defaultValue: timeFormat.format00
        }),
        outputTimeZone: Property.StaticDropdown<string>({
            displayName: "To Time Zone",
            options: {
                options: timeZoneOptions,
            },
            required: true,
            defaultValue: "UTC"
        }),
    },
    async run(context) {
        const inputDate = context.propsValue.inputDate as string;
        const inputFormat = context.propsValue.inputFormat as string;
        const inputTimeZone = context.propsValue.inputTimeZone as string;
        const outputFormat = context.propsValue.outputFormat as string;
        const outputTimeZone = context.propsValue.outputTimeZone as string;
        
        return { result: ChangeDateFormat( inputDate , inputFormat , inputTimeZone , outputFormat , outputTimeZone ) };
    }
})