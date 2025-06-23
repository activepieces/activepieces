import { Property, createAction } from '@activepieces/pieces-framework';
import {
  optionalTimeFormats,
  timeFormat,
  timeFormatDescription,
  timeZoneOptions,
  getCorrectedFormat,
} from '../common';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import advancedFormat from 'dayjs/plugin/advancedFormat';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(advancedFormat);

export const formatDateAction = createAction({
  name: 'format_date',
  displayName: 'Format Date',
  description: 'Converts a date from one format to another',
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
    inputTimeZone: Property.StaticDropdown<string>({
      displayName: 'From Time Zone',
      options: {
        options: timeZoneOptions,
      },
      required: true,
      defaultValue: 'UTC',
    }),
    outputFormat: Property.StaticDropdown({
      displayName: 'To Time Format',
      description: timeFormatDescription,
      options: {
        options: optionalTimeFormats,
      },
      required: true,
      defaultValue: timeFormat.format00,
    }),
    outputTimeZone: Property.StaticDropdown<string>({
      displayName: 'To Time Zone',
      options: {
        options: timeZoneOptions,
      },
      required: true,
      defaultValue: 'UTC',
    }),
  },
  async run(context) {
    const inputDate = context.propsValue.inputDate;
    const inputFormat = getCorrectedFormat(context.propsValue.inputFormat);
    const inputTimeZone = context.propsValue.inputTimeZone as string;
    const outputFormat = getCorrectedFormat(context.propsValue.outputFormat);
    const outputTimeZone = context.propsValue.outputTimeZone as string;

    return {
      result: changeDateFormat(
        inputDate,
        inputFormat,
        inputTimeZone,
        outputFormat,
        outputTimeZone
      ),
    };
  },
});



function changeDateFormat(
  inputDate: string,
  inputFormat: string,
  inputTimeZone: string,
  outputFormat: string,
  outputTimeZone: string
): string {
  return dayjs.tz(inputDate, inputFormat, inputTimeZone).tz(outputTimeZone).format(outputFormat);
}