import { Property, createAction } from '@activepieces/pieces-framework';
import {
  optionalTimeFormats,
  timeFormat,
  timeParts,
  inputFormatDescription,
  dateInputDescription,
  parseDate,
  getCorrectedFormat,
} from '../common';

export const extractDateParts = createAction({
  audience: 'both',
  name: 'extract_date_parts',
  classification: 'READ',
  displayName: 'Extract Date Units',
  description: 'Pull year, month, day, weekday and more out of a date',
  aiMetadata: { description: 'Parses one date string and returns the selected calendar components as separate values, any combination in a single call, with month as a 1-12 number and the weekday and month names spelled out. Use it when downstream logic needs the parts as data, for example branching on the weekday name; prefer Format Date when you only need the whole date rendered differently. Requires the date and its input pattern, and each requested unit must come from that supported set or the action throws; read-only and idempotent.', idempotent: true },
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
      displayName: 'Date',
      description: dateInputDescription,
      required: true,
    }),
    inputFormat: Property.StaticDropdown({
      displayName: 'Date Format',
      description: inputFormatDescription,
      options: {
        options: optionalTimeFormats,
      },
      required: true,
      defaultValue: timeFormat.format00,
    }),
    unitExtract: Property.StaticMultiSelectDropdown({
      displayName: 'Units',
      description: 'Each unit becomes its own output field. Month is 1 to 12.',
      options: {
        options: [
          { label: 'Year', value: timeParts.year },
          { label: 'Month', value: timeParts.month },
          { label: 'Day', value: timeParts.day },
          { label: 'Hour', value: timeParts.hour },
          { label: 'Minute', value: timeParts.minute },
          { label: 'Second', value: timeParts.second },
          { label: 'Day of Week', value: timeParts.dayOfWeek },
          { label: 'Month Name', value: timeParts.monthName },
        ],
      },
      required: true,
      defaultValue: [timeParts.year, timeParts.month, timeParts.day],
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
           // dayjs months are 0-indexed
          outputresponse[timeParts.month] = BeforeDate.month() + 1;
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
