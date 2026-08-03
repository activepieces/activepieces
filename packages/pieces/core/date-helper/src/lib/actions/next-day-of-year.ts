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

export const nextDayofYear = createAction({
  audience: 'both',
  name: 'next_day_of_year',
  displayName: 'Next Day of Year',
  description: 'Get the date and time of the next day of the year',
  aiMetadata: { description: 'Returns the next occurrence of a fixed month and day of month relative to now in a chosen time zone, rolling into next year when that date has already passed, stamped with a fixed 24h time or the current time. Use it for anniversaries and renewals; prefer Next Day of Week for weekday-based recurrence. Month and day are required (a day missing from the chosen month rolls into the following month instead of erroring) and the time must be HH:mm; not idempotent, since the base is the current clock.', idempotent: false },
  errorHandlingOptions: {
    continueOnFailure: {
      hide: true,
    },
    retryOnFailure: {
      hide: true,
    },
  },
  props: {
    month: Property.StaticDropdown({
      displayName: 'Month',
      description: 'The month that you would like to get the date and time of.',
      options: {
        options: [
          { label: 'January', value: 1 },
          { label: 'February', value: 2 },
          { label: 'March', value: 3 },
          { label: 'April', value: 4 },
          { label: 'May', value: 5 },
          { label: 'June', value: 6 },
          { label: 'July', value: 7 },
          { label: 'August', value: 8 },
          { label: 'September', value: 9 },
          { label: 'October', value: 10 },
          { label: 'November', value: 11 },
          { label: 'December', value: 12 },
        ],
      },
      required: true,
    }),
    day: Property.Number({
      displayName: 'Day of Month',
      description:
        'The day of the month that you would like to get the date and time of.',
      required: true,
      defaultValue: 1,
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
  async run(context) {
    await propsValidation.validateZod(context.propsValue, {
      day: z.number().check(z.minimum(1), z.maximum(31)),
      time: z.string().check(z.regex(/^\d\d:\d\d$/)),
    });

    const timeFormat = getCorrectedFormat(context.propsValue.timeFormat);
    const timeZone = context.propsValue.timeZone as string;
    const currentTime = context.propsValue.currentTime as boolean;
    const month = context.propsValue.month as number;
    const day = context.propsValue.day as number;
    let time = context.propsValue.time as string;

    let nextOccurrence = apDayjs().tz(timeZone);

    if (currentTime === true) {
      time = `${nextOccurrence.hour()}:${nextOccurrence.minute()}`;
    }
    const [hours, minutes] = time.split(':').map(Number);

    if (month < 1 || month > 12 || day < 1 || day > 31) {
      throw new Error(`Invalid input \nmonth: ${month} \nday: ${day}`);
    }

    const currentYear = nextOccurrence.year();

    nextOccurrence = apDayjs().tz(timeZone)
      .year(currentYear)
      .month(month - 1)
      .date(day)
      .hour(hours)
      .minute(minutes)
      .second(0)
      .millisecond(0);

    if (nextOccurrence.isBefore(apDayjs().tz(timeZone))) {
      nextOccurrence = nextOccurrence.add(1, 'year');
    }

    return { result: nextOccurrence.format(timeFormat) };
  },
});
