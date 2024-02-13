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
    if (typeof inputStartDate !== 'string') {
      throw new Error(
        `Input start date is not a string \ninput date: ${JSON.stringify(
          inputStartDate
        )}`
      );
    }
    const startDateFormat = context.propsValue.startDateFormat;
    if (typeof startDateFormat !== 'string') {
      throw new Error(
        `Input start date format is not a string \ninput date: ${JSON.stringify(
          startDateFormat
        )}`
      );
    }
    const inputEndDate = context.propsValue.endDate;
    if (typeof inputEndDate !== 'string') {
      throw new Error(
        `Input end date is not a string \ninput date: ${JSON.stringify(
          inputEndDate
        )}`
      );
    }
    const endDateFormat = context.propsValue.endDateFormat;
    if (typeof endDateFormat !== 'string') {
      throw new Error(
        `Input end date format is not a string \ninput date: ${JSON.stringify(
          endDateFormat
        )}`
      );
    }

    const startDateInfo = getDateInformation(
      inputStartDate,
      startDateFormat
    ) as dateInformation;
    const endDateInfo = getDateInformation(
      inputEndDate,
      endDateFormat
    ) as dateInformation;
    const startDate = createDateFromInfo(startDateInfo);
    const endDate = createDateFromInfo(endDateInfo);

    const unitDifference = context.propsValue.unitDifference;
    const difference = endDate.getTime() - startDate.getTime();

    const outputresponse: Record<string, number> = {};
    for (let i = 0; i < unitDifference.length; i++) {
      switch (unitDifference[i]) {
        case timeParts.year:
          outputresponse[timeParts.year] = Math.floor(
            difference / (1000 * 60 * 60 * 24 * 365)
          );
          break;
        case timeParts.month:
          outputresponse[timeParts.month] = Math.floor(
            difference / (1000 * 60 * 60 * 24 * 30)
          );
          break;
        case timeParts.day:
          outputresponse[timeParts.day] = Math.floor(
            difference / (1000 * 60 * 60 * 24)
          );
          break;
        case timeParts.hour:
          outputresponse[timeParts.hour] = Math.floor(
            difference / (1000 * 60 * 60)
          );
          break;
        case timeParts.minute:
          outputresponse[timeParts.minute] = Math.floor(
            difference / (1000 * 60)
          );
          break;
        case timeParts.second:
          outputresponse[timeParts.second] = Math.floor(difference / 1000);
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
