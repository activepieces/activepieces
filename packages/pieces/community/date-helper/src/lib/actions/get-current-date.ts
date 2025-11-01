import { Property, createAction } from '@activepieces/pieces-framework';
import dayjs from 'dayjs';
import {
  extendDayJs,
  optionalTimeFormats,
  timeFormat,
  timeFormatDescription,
  timeZoneOptions,
  getCorrectedFormat
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
    // Ensure all dayjs plugins are properly extended
    extendDayJs();
    
    const timeFormat = getCorrectedFormat(context.propsValue.timeFormat);
    const timeZone = context.propsValue.timeZone;
    return { result: dayjs().tz(timeZone).format(timeFormat) };
  },
});
