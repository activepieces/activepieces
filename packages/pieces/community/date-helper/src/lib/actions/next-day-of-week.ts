import {
  Property,
  createAction,
} from '@activepieces/pieces-framework';
import {
  optionalTimeFormats,
  timeFormat,
  timeFormatDescription,
  timeZoneOptions,
} from '../common';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import advancedFormat from 'dayjs/plugin/advancedFormat';
import { z } from 'zod';
import { propsValidation } from '@activepieces/pieces-common';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(advancedFormat);

export const nextDayofWeek = createAction({
  name: 'next_day_of_week',
  displayName: 'Next Day of Week',
  description: 'Get the date and time of the next day of the week',
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
  async run(context) {
    await propsValidation.validateZod(context.propsValue, {
      time: z.string().regex(/^\d\d:\d\d$/),
    });

    const timeFormat = context.propsValue.timeFormat;
    const timeZone = context.propsValue.timeZone as string;
    const dayIndex = context.propsValue.weekday as number;
    const currentTime = context.propsValue.currentTime as boolean;
    let time = context.propsValue.time as string;

    let nextOccurrence = dayjs().tz(timeZone);

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
      (dayDiff === 0 && nextOccurrence.isBefore(dayjs().tz(timeZone)))
    ) {
      // If it's a past day in the week or today but past time, move to next week
      dayDiff += 7;
    }
    // Set the date to the next occurrence of the given day
    nextOccurrence = nextOccurrence.add(dayDiff, 'day');

    return { result: nextOccurrence.format(timeFormat) };
  },
});
