import { Property, createAction } from "@activepieces/pieces-framework";
import { dateInformation, optionalTimeFormats, timeFormat, timeParts, timeFormatDescription, createDateFromInfo, getDateInformation } from "../common";

export const dateDifferenceAction = createAction({
    name: 'date_difference',
    displayName: 'Date Difference',
    description: 'Get the difference between two dates',
    props: {
        startDate: Property.ShortText({
            displayName: 'Starting Date',
            description: 'Enter the starting date',
            required: true,
        }),
        startDateFormat: Property.StaticDropdown({
            displayName: 'Starting date format',
            description: timeFormatDescription,
            options: {
                options: optionalTimeFormats,
            },
            required: true,
            defaultValue: timeFormat.format00
        }),
        endDate: Property.ShortText({
            displayName: 'Ending Date',
            description: 'Enter the ending date',
            required: true,
        }),
        endDateFormat: Property.StaticDropdown({
            displayName: 'Ending date format',
            description: timeFormatDescription,
            options: {
                options: optionalTimeFormats,
            },
            required: true,
            defaultValue: timeFormat.format00
        }),
        unitDifference: Property.StaticDropdown({
            displayName: 'Unit',
            description: 'Select the unit of difference between the two dates',
            options: {
                options: [
                    { label: 'Year' , value: timeParts.year },
                    { label: 'Month' , value: timeParts.month },
                    { label: 'Day' , value: timeParts.day },
                    { label: 'Hour' , value: timeParts.hour },
                    { label: 'Minute' , value: timeParts.minute },
                    { label: 'Second' , value: timeParts.second },
                ]
            },
            required: true,
            defaultValue: timeParts.year
        }),
    },
    async run(context) {
        const inputStartDate = context.propsValue.startDate;
        const startDateFormat = context.propsValue.startDateFormat;
        const inputEndDate = context.propsValue.endDate;
        const endDateFormat = context.propsValue.endDateFormat;

        const startDateInfo = getDateInformation( inputStartDate , startDateFormat ) as dateInformation;
        const endDateInfo = getDateInformation( inputEndDate , endDateFormat ) as dateInformation;
        const startDate = createDateFromInfo( startDateInfo );
        const endDate = createDateFromInfo( endDateInfo );

        const unitDifference = context.propsValue.unitDifference;
        const difference = endDate.getTime() - startDate.getTime();
        
        let res = 0;
        switch ( unitDifference ) {
            case timeParts.year:
                res = Math.floor( difference / ( 1000 * 60 * 60 * 24 * 365 ) );
                break;
            case timeParts.month:
                res = Math.floor( difference / ( 1000 * 60 * 60 * 24 * 30 ) );
                break;
            case timeParts.day:
                res = Math.floor( difference / ( 1000 * 60 * 60 * 24 ) );
                break;
            case timeParts.hour:
                res = Math.floor( difference / ( 1000 * 60 * 60 ) );
                break;
            case timeParts.minute:
                res = Math.floor( difference / ( 1000 * 60 ) );
                break;
            case timeParts.second:
                res = Math.floor( difference / ( 1000 ) );
                break;
        }

        return { result : res };
    }
})
