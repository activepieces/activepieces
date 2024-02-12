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

export const nextDayofYear = createAction({
  name: 'next_day_of_year',
  displayName: 'Next Day of Year',
  description: 'Get the date and time of the next day of the year',
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
      validators: [Validators.minValue(1), Validators.maxValue(31)],
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
    const currentTime = context.propsValue.currentTime as boolean;
    const month = context.propsValue.month as number;
    const day = context.propsValue.day as number;
    let time = context.propsValue.time as string;

    const now = new Date();

    if (currentTime === true) {
      time = `${now.getHours()}:${now.getMinutes()}`;
    }
    const [hours, minutes] = time.split(':').map(Number);

    // Validate inputs
    if (month < 1 || month > 12 || day < 1 || day > 31) {
      throw new Error(`Invalid input \nmonth: ${month} \nday: ${day}`);
    }

    if (typeof timeFormat !== 'string') {
      throw new Error(
        `Output format is not a string \noutput format: ${JSON.stringify(
          timeFormat
        )}`
      );
    }

    const currentYear = now.getFullYear();

    // Create a date object for the next occurrence
    const nextOccurrence = new Date(currentYear, month - 1, day);
    nextOccurrence.setHours(hours, minutes, 0, 0);

    // Check if the next occurrence is already past in the current year
    if (nextOccurrence.getTime() < now.getTime()) {
      // Move to the next year
      nextOccurrence.setFullYear(currentYear + 1);
    }

    // Set the time for the timezone
    nextOccurrence.setMinutes(
      nextOccurrence.getMinutes() + timeDiff('UTC', timeZone)
    );

    return { result: createNewDate(nextOccurrence, timeFormat) };
  },
});
