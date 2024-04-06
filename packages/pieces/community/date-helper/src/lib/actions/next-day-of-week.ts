import {
  Property,
  createAction,
  Validators,
} from '@activepieces/pieces-framework';
import {
  optionalTimeFormats,
  timeFormat,
  timeFormatDescription,
  createNewDate,
  timeZoneOptions,
  timeDiff,
} from '../common';

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
      validators: [Validators.pattern(/^\d\d:\d\d$/)],
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
    const timeFormat = context.propsValue.timeFormat;
    const timeZone = context.propsValue.timeZone as string;
    const dayIndex = context.propsValue.weekday as number;
    const currentTime = context.propsValue.currentTime as boolean;
    let time = context.propsValue.time as string;

    const nextOccurrence = new Date();

    if (currentTime === true) {
      time = `${nextOccurrence.getHours()}:${nextOccurrence.getMinutes()}`;
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

    if (typeof timeFormat !== 'string') {
      throw new Error(
        `Output format is not a string \noutput format: ${JSON.stringify(
          timeFormat
        )}`
      );
    }

    // Set the time
    nextOccurrence.setHours(hours, minutes, 0, 0);

    // Calculate the day difference
    let dayDiff = dayIndex - nextOccurrence.getDay();
    console.log('dayDiff:', dayDiff, nextOccurrence, new Date());
    if (
      dayDiff < 0 ||
      (dayDiff === 0 && nextOccurrence.getTime() < new Date().getTime())
    ) {
      // If it's a past day in the week or today but past time, move to next week
      dayDiff += 7;
    }
    // Set the date to the next occurrence of the given day
    nextOccurrence.setDate(nextOccurrence.getDate() + dayDiff);

    // Set the time for the timezone
    nextOccurrence.setMinutes(
      nextOccurrence.getMinutes() + timeDiff('UTC', timeZone)
    );

    return { result: createNewDate(nextOccurrence, timeFormat) };
  },
});
