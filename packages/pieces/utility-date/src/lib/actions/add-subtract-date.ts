import { Property, createAction } from "@activepieces/pieces-framework";
import { addSubtractTime, optionalTimeFormats, timeFormat, timeFormatDescription, createNewDate, getDateInformation } from "../common";

export const addSubtractDateAction = createAction({
    name: 'add_subtract_date',
    displayName: 'Add/Subtract Time',
    description: 'Add or subtract time from a date',
    props: {
        inputDate: Property.ShortText({
            displayName: 'Input Date',
            description: 'Enter the input date',
            required: true,
        }),
        inputDateFormat: Property.StaticDropdown({
            displayName: 'From Time Format',
            description: timeFormatDescription,
            options: {
                options: optionalTimeFormats,
            },
            required: true,
            defaultValue: timeFormat.format00
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
        expression: Property.LongText({
            displayName: 'Expression',
            description: `Provide the amount of time you would like to add or subtract to the date using units like ( year , month , day , hour , minute or second ) . Examples: +2 second 1 hour , + 1 year - 3 day - 2month , + 5 minutes.`,
            required: true,
        }),
    },
    async run(context) {
        const inputDate = context.propsValue.inputDate;
        const inputDateFormat = context.propsValue.inputDateFormat;
        const outputFormat = context.propsValue.outputFormat;
        const expression = context.propsValue.expression;

        const DateInfo = getDateInformation( inputDate , inputDateFormat );
        const BeforeDate = new Date( DateInfo.year , DateInfo.month - 1 , DateInfo.day , DateInfo.hour , DateInfo.minute , DateInfo.second );
        const AfterDate = addSubtractTime( BeforeDate , expression );

        return { result : createNewDate( AfterDate , outputFormat )};
    }
})
