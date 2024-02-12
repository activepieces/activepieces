import { Property, createAction } from '@activepieces/pieces-framework';
import {
  ChangeDateFormat,
  optionalTimeFormats,
  timeFormat,
  timeFormatDescription,
  timeZoneOptions,
} from '../common';

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
    if (typeof inputDate !== 'string') {
      throw new Error(
        `Input date is not a string \ninput date: ${JSON.stringify(inputDate)}`
      );
    }
    const inputFormat = context.propsValue.inputFormat as string;
    if (typeof inputFormat !== 'string') {
      throw new Error(
        `Input format is not a string \ninput format: ${JSON.stringify(
          inputDate
        )}`
      );
    }
    const inputTimeZone = context.propsValue.inputTimeZone as string;
    const outputFormat = context.propsValue.outputFormat as string;
    if (typeof outputFormat !== 'string') {
      throw new Error(
        `Output format is not a string \noutput format: ${JSON.stringify(
          inputDate
        )}`
      );
    }
    const outputTimeZone = context.propsValue.outputTimeZone as string;

    return {
      result: ChangeDateFormat(
        inputDate,
        inputFormat,
        inputTimeZone,
        outputFormat,
        outputTimeZone
      ),
    };
  },
});
