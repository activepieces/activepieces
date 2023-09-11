import { Property, createAction } from "@activepieces/pieces-framework";
import { dateInformation, optionalTimeFormats, timeFormat, timeParts, timeFormatDescription, createDateFromInfo, getDateInformation } from "../common";

export const extractDateParts = createAction({
    name: 'extract_date_parts',
    displayName: 'Extract Date Units',
    description: 'Extract date units ( year , month , day , hour , minute , second , day of week , month name ) from a date',
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
        unitExtract: Property.StaticDropdown({
            displayName: 'Unit to Extract',
            description: 'Select the unit to extract from the date',
            options: {
                options: [
                    { label: 'Year' , value: timeParts.year },
                    { label: 'Month' , value: timeParts.month },
                    { label: 'Day' , value: timeParts.day },
                    { label: 'Hour' , value: timeParts.hour },
                    { label: 'Minute' , value: timeParts.minute },
                    { label: 'Second' , value: timeParts.second },
                    { label: 'Day of Week' , value: timeParts.dayOfWeek },
                    { label: 'Month name' , value: timeParts.monthName },
                ]
            },
            required: true,
            defaultValue: timeParts.year
        }),
    },
    async run(context) {
        const inputDate = context.propsValue.inputDate;
        const inputFormat = context.propsValue.inputFormat;
        const unitExtract = context.propsValue.unitExtract as timeParts;
        
        const DateInfo = getDateInformation( inputDate , inputFormat ) as dateInformation;
        const BeforeDate = createDateFromInfo( DateInfo );
        let res ;
        switch ( unitExtract ) {
            case timeParts.year:
                res = DateInfo.year;
                break;
            case timeParts.month:
                res = DateInfo.month;
                break;
            case timeParts.day:
                res = DateInfo.day;
                break;
            case timeParts.hour:
                res = DateInfo.hour;
                break;
            case timeParts.minute:
                res = DateInfo.minute;
                break;
            case timeParts.second:
                res = DateInfo.second;
                break;
            case timeParts.dayOfWeek:
                res = BeforeDate.toLocaleString('en-us', { weekday: 'long' });
                break;
            case timeParts.monthName:
                res = BeforeDate.toLocaleString('en-us', { month: 'long' });
                break;
            case timeParts.unix_time:
                throw new Error(`Invalid unit ${unitExtract}`);            
        }
        return { result:res };
    }
})
