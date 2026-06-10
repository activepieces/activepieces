import { Property, createAction } from '@activepieces/pieces-framework';
import {
  optionalTimeFormats,
  timeFormat,
  timeFormatDescription,
  timeZoneOptions,
  getCorrectedFormat,
  apDayjs,
} from '../common';
import { z } from 'zod';
import { propsValidation } from '@activepieces/pieces-common';

export const firstDayOfPreviousMonthAction = createAction({
  name: 'first_day_of_previous_month',
  displayName: 'First Day of Previous Month',
  description: 'Get the date and time of the first day of the previous month',
  errorHandlingOptions: {
    continueOnFailure: {
      hide: true,
    },
    retryOnFailure: {
      hide: true,
    },
  },
  props: {
    time: Property.ShortText({
      displayName: '24h Time',
      description:
        'The time that you would like to get the date and time of. This must be in 24h format.',
      required: false,
      defaultValue: '00:00',
    }),
    currentTime: Property.Checkbox({
      displayName: 'Use Current Time',
      description:
        'If checked, the current time will be used instead of the time specified above.',
      required: false,
      defaultValue: false,
    }),
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
    await propsValidation.validateZod(context.propsValue, {
      time: z.string().regex(/^\d\d:\d\d$/),
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
