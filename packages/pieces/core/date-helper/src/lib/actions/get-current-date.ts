import { Property, createAction } from '@activepieces/pieces-framework';
import {
  optionalTimeFormats,
  timeFormat,
  timeFormatDescription,
  timeZoneOptions,
  getCorrectedFormat,
  apDayjs
} from '../common';
import { getCurrentDateActionOutputSchema } from '../output-schemas';

export const getCurrentDate = createAction({
  audience: 'both',
  name: 'get_current_date',
  displayName: 'Get Current Date',
  description: 'Get the current date',
  aiMetadata: { description: 'Reads the clock and returns the current date and time for a chosen IANA time zone, rendered with one of 15 preset patterns (including unix seconds via X). Use it to stamp a run with the current instant or to produce the base date that Format Date, Add/Subtract Time or Date Difference consume; it accepts no date input, so prefer Format Date when you already have a date string. Output format and time zone are both required; not idempotent, since every call reads the clock and returns a different value.', idempotent: false },
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
  outputSchema: getCurrentDateActionOutputSchema,
  async run(context) {
    const timeFormat = getCorrectedFormat(context.propsValue.timeFormat);
    const timeZone = context.propsValue.timeZone;
    return { result: apDayjs().tz(timeZone).format(timeFormat) };
  },
});
