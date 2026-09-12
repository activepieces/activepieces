import { Property, createAction } from '@activepieces/pieces-framework';
import {
  optionalTimeFormats,
  timeFormat,
  outputFormatDescription,
  timeInputDescription,
  timeInputPlaceholder,
  useCurrentTimeDescription,
  timeZoneOptions,
  getCorrectedFormat,
  apDayjs,
} from '../common';
import * as z from 'zod/mini'
import { propsValidation } from '@activepieces/pieces-common';
import { firstDayOfPreviousMonthActionOutputSchema } from '../output-schemas';

export const firstDayOfPreviousMonthAction = createAction({
  audience: 'both',
  name: 'first_day_of_previous_month',
  classification: 'READ',
  displayName: 'First Day of Previous Month',
  description: 'Get the date and time of the first day of the previous month',
  aiMetadata: { description: 'Returns the first calendar day of the month before the current month, stamped with midnight, a supplied 24h time, or the current time. Use it as the opening bound of a last-month reporting window, paired with Last Day of Previous Month; use Add/Subtract Time for an arbitrary offset from a specific date. Time zone and output format are required and the time must be HH:mm; not idempotent - the window is derived from the current clock and changes once the month rolls over.', idempotent: false },
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
      displayName: 'Output Format',
      description: outputFormatDescription,
      options: {
        options: optionalTimeFormats,
      },
      required: true,
      defaultValue: timeFormat.format00,
    }),
    timeZone: Property.StaticDropdown<string>({
      displayName: 'Time Zone',
      description:
        'Time zone used to work out the date and to report the result.',
      options: {
        options: timeZoneOptions,
      },
      required: true,
      defaultValue: 'UTC',
    }),
    time: Property.ShortText({
      displayName: 'Time',
      description: timeInputDescription,
      placeholder: timeInputPlaceholder,
      required: false,
      defaultValue: '00:00',
    }),
    currentTime: Property.Checkbox({
      displayName: 'Use Current Time',
      description: useCurrentTimeDescription,
      required: false,
      defaultValue: false,
      advanced: true,
    }),
  },
  outputSchema: firstDayOfPreviousMonthActionOutputSchema,
  async run(context) {
    await propsValidation.validateZod(context.propsValue, {
      time: z.string().check(z.regex(/^\d\d:\d\d$/)),
    });

    const outputTimeFormat = getCorrectedFormat(context.propsValue.timeFormat);
    const selectedTimeZone = context.propsValue.timeZone as string;
    const useCurrentTime = context.propsValue.currentTime as boolean;
    let providedTime = context.propsValue.time as string;

    const baseDateTime = apDayjs().tz(selectedTimeZone);

    if (useCurrentTime === true) {
      providedTime = `${baseDateTime.hour()}:${baseDateTime.minute()}`;
    }
    const [hours, minutes] = providedTime.split(':').map(Number);

    // Validate inputs
    if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
      throw new Error(`Invalid input \nhours: ${hours} \nminutes: ${minutes}`);
    }

    const firstDayOfPreviousMonth = baseDateTime
      .subtract(1, 'month')
      .startOf('month')
      .hour(hours)
      .minute(minutes)
      .second(0)
      .millisecond(0);

    return { result: firstDayOfPreviousMonth.format(outputTimeFormat) };
  },
});
