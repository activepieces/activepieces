import { Property, createAction } from "@activepieces/pieces-framework";
import { AddSubtractTime, OptionalTimeFormats, TimeFormat, action_description, createNewDate, getDateInformation } from "../common";

export const addSubtractDateAction = createAction({
    name: 'add_subtract_date',
    displayName: 'Add/Subtract Time',
    description: 'Add or subtract time from a date',
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
        OutputFormat: Property.StaticDropdown({
            displayName: 'To Time Format',
            description: action_description,
            options: {
                options: OptionalTimeFormats,
            },
            required: true,
            defaultValue: TimeFormat.format00
        }),
        expression: Property.LongText({
            displayName: 'Expression',
            description: `Provide the amount of time you would like to add or subtract to the date using units like ( year , month , day , hour , minute or second ) . Examples: +2 second 1 hour , + 1 year - 3 day - 2month , + 5 minutes.`,
            required: true,
            defaultValue: ''
        }),
    },
    async run(context) {
        const inputDate = context.propsValue.InputDate;
        const inputFormat = context.propsValue.InputFormat;
        const outputFormat = context.propsValue.OutputFormat;
        const expression = context.propsValue.expression;

        const DateInfo = getDateInformation( inputDate , inputFormat );
        const BeforeDate = new Date( DateInfo.year , DateInfo.month - 1 , DateInfo.day , DateInfo.hour , DateInfo.minute , DateInfo.second );
        const AfterDate = AddSubtractTime( BeforeDate , expression );

        return { result : createNewDate( AfterDate , outputFormat )};
    }
})
