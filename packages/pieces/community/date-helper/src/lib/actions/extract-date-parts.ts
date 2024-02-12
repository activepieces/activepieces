import { Property, createAction } from '@activepieces/pieces-framework';
import {
  dateInformation,
  optionalTimeFormats,
  timeFormat,
  timeParts,
  timeFormatDescription,
  createDateFromInfo,
  getDateInformation,
} from '../common';

export const extractDateParts = createAction({
  name: 'extract_date_parts',
  displayName: 'Extract Date Units',
  description:
    'Extract date units ( year , month , day , hour , minute , second , day of week , month name ) from a date',
  errorHandlingOptions: {
    continueOnFailure: {
      hide: true,
    },
    retryOnFailure: {
      hide: true,
    },
  },
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
      defaultValue: timeFormat.format00,
    }),
    unitExtract: Property.StaticMultiSelectDropdown({
      displayName: 'Unit to Extract',
      description: 'Select the unit to extract from the date',
      options: {
        options: [
          { label: 'Year', value: timeParts.year },
          { label: 'Month', value: timeParts.month },
          { label: 'Day', value: timeParts.day },
          { label: 'Hour', value: timeParts.hour },
          { label: 'Minute', value: timeParts.minute },
          { label: 'Second', value: timeParts.second },
          { label: 'Day of Week', value: timeParts.dayOfWeek },
          { label: 'Month name', value: timeParts.monthName },
        ],
      },
      required: true,
      defaultValue: [timeParts.year],
    }),
  },
  async run(context) {
    const inputDate = context.propsValue.inputDate;
    if (typeof inputDate !== 'string') {
      throw new Error(
        `Input date is not a string \ninput date: ${JSON.stringify(inputDate)}`
      );
    }
    const inputFormat = context.propsValue.inputFormat;
    if (typeof inputFormat !== 'string') {
      throw new Error(
        `Input format is not a string \ninput format: ${JSON.stringify(
          inputDate
        )}`
      );
    }
    const unitExtract = context.propsValue.unitExtract;

    const DateInfo = getDateInformation(
      inputDate,
      inputFormat
    ) as dateInformation;
    const BeforeDate = createDateFromInfo(DateInfo);
    const outputresponse: Record<string, any> = {};

    for (let i = 0; i < unitExtract.length; i++) {
      switch (unitExtract[i]) {
        case timeParts.year:
          outputresponse[timeParts.year] = DateInfo.year;
          break;
        case timeParts.month:
          outputresponse[timeParts.month] = DateInfo.month;
          break;
        case timeParts.day:
          outputresponse[timeParts.day] = DateInfo.day;
          break;
        case timeParts.hour:
          outputresponse[timeParts.hour] = DateInfo.hour;
          break;
        case timeParts.minute:
          outputresponse[timeParts.minute] = DateInfo.minute;
          break;
        case timeParts.second:
          outputresponse[timeParts.second] = DateInfo.second;
          break;
        case timeParts.dayOfWeek:
          outputresponse[timeParts.dayOfWeek] = BeforeDate.toLocaleString(
            'en-us',
            { weekday: 'long' }
          );
          break;
        case timeParts.monthName:
          outputresponse[timeParts.monthName] = BeforeDate.toLocaleString(
            'en-us',
            { month: 'long' }
          );
          break;
        case timeParts.unix_time:
        default:
          throw new Error(
            `Invalid unit to extract :\n${JSON.stringify(unitExtract[i])}`
          );
      }
    }
    return outputresponse;
  },
});
