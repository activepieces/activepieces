import { Property, createAction } from '@activepieces/pieces-framework'
import {
  optionalTimeFormats,
  timeFormat,
  timeParts,
  timeFormatDescription,
  parseDate,
  getCorrectedFormat,
  apDayjs,
} from '../common';

export const dateDifferenceAction = createAction({
  name: 'date_difference',
  displayName: 'Date Difference',
  description: 'Get the difference between two dates',
  errorHandlingOptions: {
    continueOnFailure: {
      hide: true,
    },
    retryOnFailure: {
      hide: true,
    },
  },
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
      defaultValue: timeFormat.format00,
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
      defaultValue: timeFormat.format00,
    }),
    unitDifference: Property.StaticMultiSelectDropdown({
      displayName: 'Unit',
      description: 'Select the unit of difference between the two dates',
      options: {
        options: [
          { label: 'Year', value: timeParts.year },
          { label: 'Month', value: timeParts.month },
          { label: 'Day', value: timeParts.day },
          { label: 'Hour', value: timeParts.hour },
          { label: 'Minute', value: timeParts.minute },
          { label: 'Second', value: timeParts.second },
        ],
      },
      required: true,
      defaultValue: [timeParts.year],
    }),
  },
  async run(context) {
    
    const inputStartDate = context.propsValue.startDate;
    const startDateFormat = getCorrectedFormat(context.propsValue.startDateFormat);
    const inputEndDate = context.propsValue.endDate;
    const endDateFormat = getCorrectedFormat(context.propsValue.endDateFormat);
    const startDate = parseDate(inputStartDate, startDateFormat);
    const endDate = parseDate(inputEndDate, endDateFormat);

    const unitDifference = context.propsValue.unitDifference;
    const difference = apDayjs.duration(endDate.diff(startDate));

    const outputresponse: Record<string, number> = {};
    for (let i = 0; i < unitDifference.length; i++) {
      switch (unitDifference[i]) {
        case timeParts.year:
          outputresponse[timeParts.year] = difference.years();
          break;
        case timeParts.month:
          outputresponse[timeParts.month] = difference.months();
          break;
        case timeParts.day:
          outputresponse[timeParts.day] = difference.days();
          break;
        case timeParts.hour:
          outputresponse[timeParts.hour] = difference.hours();
          break;
        case timeParts.minute:
          outputresponse[timeParts.minute] = difference.minutes();
          break;
        case timeParts.second:
          outputresponse[timeParts.second] = difference.seconds();
          break;
        default:
          throw new Error(
            `Invalid unit :\n${JSON.stringify(unitDifference[i])}`
          );
      }
    }

    return outputresponse;
  },
});
