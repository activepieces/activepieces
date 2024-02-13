import { Property, createAction } from '@activepieces/pieces-framework';
import {
  optionalTimeFormats,
  timeFormat,
  timeFormatDescription,
  createNewDate,
  timeZoneOptions,
  timeDiff,
} from '../common';

export const getCurrentDate = createAction({
  name: 'get_current_date',
  displayName: 'Get Current Date',
  description: 'Get the current date',
  errorHandlingOptions: {
    continueOnFailure: {
      hide: true,
    },
    retryOnFailure: {
      hide: true,
    },
  },
  props: {
    timeFormat: Property.StaticDropdown({
      displayName: 'To Time Format',
      description: timeFormatDescription,
      options: {
        options: optionalTimeFormats,
      },
      required: true,
      defaultValue: timeFormat.format00,
    }),
    timeZone: Property.StaticDropdown<string>({
      displayName: 'Time Zone',
      options: {
        options: timeZoneOptions,
      },
      required: true,
      defaultValue: 'UTC',
    }),
  },
  async run(context) {
    const timeFormat = context.propsValue.timeFormat;
    const timeZone = context.propsValue.timeZone as string;
    const date = new Date();

    if (typeof timeFormat !== 'string') {
      throw new Error(
        `Output format is not a string \noutput format: ${JSON.stringify(
          timeFormat
        )}`
      );
    }

    date.setMinutes(date.getMinutes() + timeDiff('UTC', timeZone));

    return { result: createNewDate(date, timeFormat) };
  },
});
