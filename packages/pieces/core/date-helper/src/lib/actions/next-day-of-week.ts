import {
  Property,
  createAction,
} from '@activepieces/pieces-framework';
import {
  optionalTimeFormats,
  timeFormat,
  timeFormatDescription,
  timeZoneOptions,
  getCorrectedFormat,
  apDayjs,
} from '../common';
import * as z from 'zod/mini'
import { propsValidation } from '@activepieces/pieces-common';
import { nextDayOfWeekActionOutputSchema } from '../output-schemas';

export const nextDayofWeek = createAction({
  audience: 'both',
  name: 'next_day_of_week',
  displayName: 'Next Day of Week',
  description: 'Get the date and time of the next day of the week',
  aiMetadata: { description: 'Returns the next occurrence of a given weekday in a chosen time zone, stamped with a fixed 24h time or the current time; when today is that weekday but the target time has already passed, it rolls forward a full week. Use Next Day of Year for a month-and-day anniversary and Add/Subtract Time to offset a date you already hold. The weekday is required and the time must be HH:mm; not idempotent, since the result derives from the current clock and identical inputs return different dates over time.', idempotent: false },
  errorHandlingOptions: {
    continueOnFailure: {
      hide: true,
    },
    retryOnFailure: {
      hide: true,
    },
  },
  props: {
    weekday: Property.StaticDropdown({
      displayName: 'Weekday',
      description:
        'The weekday that you would like to get the date and time of.',
      options: {
        options: [
          { label: 'Sunday', value: 0 },
          { label: 'Monday', value: 1 },
          { label: 'Tuesday', value: 2 },
          { label: 'Wednesday', value: 3 },
          { label: 'Thursday', value: 4 },
          { label: 'Friday', value: 5 },
          { label: 'Saturday', value: 6 },
        ],
      },
      required: true,
    }),
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
  outputSchema: nextDayOfWeekActionOutputSchema,
  async run(context) {
    await propsValidation.validateZod(context.propsValue, {
      time: z.string().check(z.regex(/^\d\d:\d\d$/)),
    });

    const timeFormat = getCorrectedFormat(context.propsValue.timeFormat);
    const timeZone = context.propsValue.timeZone as string;
    const dayIndex = context.propsValue.weekday as number;
    const currentTime = context.propsValue.currentTime as boolean;
    let time = context.propsValue.time as string;

    let nextOccurrence = apDayjs().tz(timeZone);

    if (currentTime === true) {
      time = `${nextOccurrence.hour()}:${nextOccurrence.minute()}`;
    }
    const [hours, minutes] = time.split(':').map(Number);

    // Validate inputs
    if (
      dayIndex < 0 ||
      dayIndex > 6 ||
      hours < 0 ||
      hours > 23 ||
      minutes < 0 ||
      minutes > 59
    ) {
      throw new Error(
        `Invalid input \ndayIndex: ${dayIndex} \nhours: ${hours} \nminutes: ${minutes}`
      );
    }

    // Set the time
    nextOccurrence = nextOccurrence.hour(hours).minute(minutes).second(0).millisecond(0);

    // Calculate the day difference
    let dayDiff = dayIndex - nextOccurrence.day();
    if (
      dayDiff < 0 ||
      (dayDiff === 0 && nextOccurrence.isBefore(apDayjs().tz(timeZone)))
    ) {
      // If it's a past day in the week or today but past time, move to next week
      dayDiff += 7;
    }
    // Set the date to the next occurrence of the given day
    nextOccurrence = nextOccurrence.add(dayDiff, 'day');

    return { result: nextOccurrence.format(timeFormat) };
  },
});
