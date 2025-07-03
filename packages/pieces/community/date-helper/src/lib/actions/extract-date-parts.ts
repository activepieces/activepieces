import { Property, createAction } from '@activepieces/pieces-framework';
import {
  optionalTimeFormats,
  timeFormat,
  timeParts,
  timeFormatDescription,
  parseDate,
  getCorrectedFormat,
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
    const inputFormat = getCorrectedFormat(context.propsValue.inputFormat);
    const unitExtract = context.propsValue.unitExtract;

    const BeforeDate = parseDate(inputDate, inputFormat);
    const outputresponse: Record<string, any> = {};

    for (let i = 0; i < unitExtract.length; i++) {
      switch (unitExtract[i]) {
        case timeParts.year:
          outputresponse[timeParts.year] = BeforeDate.year();
          break;
        case timeParts.month:
          outputresponse[timeParts.month] = BeforeDate.month() + 1; // dayjs months are 0-indexed
          break;
        case timeParts.day:
          outputresponse[timeParts.day] = BeforeDate.date();
          break;
        case timeParts.hour:
          outputresponse[timeParts.hour] = BeforeDate.hour();
          break;
        case timeParts.minute:
          outputresponse[timeParts.minute] = BeforeDate.minute();
          break;
        case timeParts.second:
          outputresponse[timeParts.second] = BeforeDate.second();
          break;
        case timeParts.dayOfWeek:
          outputresponse[timeParts.dayOfWeek] = BeforeDate.format('dddd');
          break;
        case timeParts.monthName:
          outputresponse[timeParts.monthName] = BeforeDate.format('MMMM');
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
