import { Property, createAction } from '@activepieces/pieces-framework'
import {
  optionalTimeFormats,
  timeFormat,
  timeParts,
  inputFormatDescription,
  dateInputDescription,
  parseDate,
  getCorrectedFormat,
  apDayjs,
} from '../common';

export const dateDifferenceAction = createAction({
  audience: 'both',
  name: 'date_difference',
  classification: 'READ',
  displayName: 'Date Difference',
  description: 'Get the difference between two dates',
  aiMetadata: { description: 'Measures the elapsed time between a start date and an end date, returning any combination of the requested units in one call. Use it to compare two known dates for age, SLA or gap checks; use Add/Subtract Time instead to shift a single date. Each date needs its own input pattern, and the units are decomposed duration components rather than totals - the day value is the remainder inside the month - and come back negative when the end date precedes the start; read-only and idempotent.', idempotent: true },
  errorHandlingOptions: {
    continueOnFailure: {
      hide: true,
    },
    retryOnFailure: {
      hide: true,
    },
  },
  propertyGroups: [
    {
      key: 'start',
      display: 'section',
      label: 'Start',
      icon: 'calendar',
      props: ['startDate', 'startDateFormat'],
    },
    {
      key: 'end',
      display: 'section',
      label: 'End',
      icon: 'calendar',
      props: ['endDate', 'endDateFormat'],
    },
  ],
  props: {
    startDate: Property.ShortText({
      displayName: 'Date',
      description: dateInputDescription,
      required: true,
    }),
    startDateFormat: Property.StaticDropdown({
      displayName: 'Format',
      description: inputFormatDescription,
      options: {
        options: optionalTimeFormats,
      },
      required: true,
      defaultValue: timeFormat.format00,
    }),
    endDate: Property.ShortText({
      displayName: 'Date',
      description: dateInputDescription,
      required: true,
    }),
    endDateFormat: Property.StaticDropdown({
      displayName: 'Format',
      description: inputFormatDescription,
      options: {
        options: optionalTimeFormats,
      },
      required: true,
      defaultValue: timeFormat.format00,
    }),
    unitDifference: Property.StaticMultiSelectDropdown({
      displayName: 'Units',
      description: 'Each unit becomes its own output field, as remainders not totals.',
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
      defaultValue: [timeParts.day],
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
