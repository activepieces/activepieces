import { Property, createAction } from "@activepieces/pieces-framework";
import { DateInformation, OptionalTimeFormats, TimeFormat, Timeparts, action_description, createDateFromInfo, getDateInformation } from "../common";

export const extractDateParts = createAction({
    name: 'extract_date_parts',
    displayName: 'Extract Date Units',
    description: 'Extract date units from a date',
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
        UnitExtract: Property.StaticDropdown({
            displayName: 'Unit to Extract',
            description: 'Select the unit to extract',
            options: {
                options: [
                    { label: 'Year' , value: Timeparts.year },
                    { label: 'Month' , value: Timeparts.month },
                    { label: 'Day' , value: Timeparts.day },
                    { label: 'Hour' , value: Timeparts.hour },
                    { label: 'Minute' , value: Timeparts.minute },
                    { label: 'Second' , value: Timeparts.second },
                    { label: 'Day of Week' , value: Timeparts.dayOfWeek },
                    { label: 'Month name' , value: Timeparts.monthName },
                ]
            },
            required: true,
            defaultValue: Timeparts.year
        }),
    },
    async run(context) {
        const inputDate = context.propsValue.InputDate;
        const inputFormat = context.propsValue.InputFormat;
        const unitExtract = context.propsValue.UnitExtract as Timeparts;
        
        const DateInfo = getDateInformation( inputDate , inputFormat ) as DateInformation;
        const BeforeDate = createDateFromInfo( DateInfo );
        let res ;
        switch ( unitExtract ) {
            case Timeparts.year:
                res = DateInfo.year;
                break;
            case Timeparts.month:
                res = DateInfo.month;
                break;
            case Timeparts.day:
                res = DateInfo.day;
                break;
            case Timeparts.hour:
                res = DateInfo.hour;
                break;
            case Timeparts.minute:
                res = DateInfo.minute;
                break;
            case Timeparts.second:
                res = DateInfo.second;
                break;
            case Timeparts.dayOfWeek:
                res = BeforeDate.toLocaleString('en-us', { weekday: 'long' });
                break;
            case Timeparts.monthName:
                res = BeforeDate.toLocaleString('en-us', { month: 'long' });
                break;
            case Timeparts.unix_time:
                throw new Error(`Invalid unit ${unitExtract}`);            
        }
        return { result:res };
    }
})
