import { Property, createAction } from "@activepieces/pieces-framework";
import { DateInformation, OptionalTimeFormats, TimeFormat, Timeparts, action_description, createDateFromInfo, getDateInformation } from "../common";

export const dateDifferenceAction = createAction({
    name: 'date_difference',
    displayName: 'Date Difference',
    description: 'Get the difference between two dates',
    props: {
        InputDate1: Property.ShortText({
            displayName: 'Input Date 1',
            description: 'Enter the first input date',
            required: true,
            defaultValue: ''
        }),
        InputFormat1: Property.StaticDropdown({
            displayName: 'Input Date 1 Format',
            description: action_description,
            options: {
                options: OptionalTimeFormats,
            },
            required: true,
            defaultValue: TimeFormat.format00
        }),
        InputDate2: Property.ShortText({
            displayName: 'Input Date 2',
            description: 'Enter the second input date',
            required: true,
            defaultValue: ''
        }),
        InputFormat2: Property.StaticDropdown({
            displayName: 'Input Date 2 Format',
            description: action_description,
            options: {
                options: OptionalTimeFormats,
            },
            required: true,
            defaultValue: TimeFormat.format00
        }),
        unitDifference: Property.StaticDropdown({
            displayName: 'Unit of Difference',
            description: 'Select the unit of difference',
            options: {
                options: [
                    { label: 'Year' , value: Timeparts.year },
                    { label: 'Month' , value: Timeparts.month },
                    { label: 'Day' , value: Timeparts.day },
                    { label: 'Hour' , value: Timeparts.hour },
                    { label: 'Minute' , value: Timeparts.minute },
                    { label: 'Second' , value: Timeparts.second },
                ]
            },
            required: true,
            defaultValue: Timeparts.year
        }),
    },
    async run(context) {
        const inputDate1 = context.propsValue.InputDate1;
        const inputFormat1 = context.propsValue.InputFormat1;
        const inputDate2 = context.propsValue.InputDate2;
        const inputFormat2 = context.propsValue.InputFormat2;
        const date1_info = getDateInformation( inputDate1 , inputFormat1 ) as DateInformation;
        const date2_info = getDateInformation( inputDate2 , inputFormat2 ) as DateInformation;
        const date1 = createDateFromInfo( date1_info );
        const date2 = createDateFromInfo( date2_info );

        const unitDifference = context.propsValue.unitDifference;
        const difference = date1.getTime() - date2.getTime();
        let res = 0;
        switch ( unitDifference ) {
            case Timeparts.year:
                res = Math.floor( difference / ( 1000 * 60 * 60 * 24 * 365 ) );
                break;
            case Timeparts.month:
                res = Math.floor( difference / ( 1000 * 60 * 60 * 24 * 30 ) );
                break;
            case Timeparts.day:
                res = Math.floor( difference / ( 1000 * 60 * 60 * 24 ) );
                break;
            case Timeparts.hour:
                res = Math.floor( difference / ( 1000 * 60 * 60 ) );
                break;
            case Timeparts.minute:
                res = Math.floor( difference / ( 1000 * 60 ) );
                break;
            case Timeparts.second:
                res = Math.floor( difference / ( 1000 ) );
                break;
        }

        return { result : res };
    }
})
