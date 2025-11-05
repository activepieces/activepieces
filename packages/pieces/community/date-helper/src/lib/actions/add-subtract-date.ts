import { Property, createAction } from '@activepieces/pieces-framework';
import dayjs from 'dayjs';
import {
  apDayjs,
   getCorrectedFormat,
  optionalTimeFormats,
  parseDate,
  timeFormat,
  timeFormatDescription,
  timeParts,
  timeZoneOptions,
} from '../common';
import { z } from 'zod';
import { propsValidation } from '@activepieces/pieces-common';

export const addSubtractDateAction = createAction({
  name: 'add_subtract_date',
  displayName: 'Add/Subtract Time',
  description: 'Add or subtract time from a date',
  errorHandlingOptions: {
    continueOnFailure: {
      hide: true,
    },
    retryOnFailure: {
      hide: true,
    },
  },
  props: {
    inputDate: Property.ShortText({
      displayName: 'Input Date',
      description: 'Enter the input date',
      required: true,
    }),
    inputDateFormat: Property.StaticDropdown({
      displayName: 'From Time Format',
      description: timeFormatDescription,
      options: {
        options: optionalTimeFormats,
      },
      required: true,
      defaultValue: getCorrectedFormat(timeFormat.format00),
    }),
    outputFormat: Property.StaticDropdown({
      displayName: 'To Time Format',
      description: timeFormatDescription,
      options: {
        options: optionalTimeFormats,
      },
      required: true,
      defaultValue: getCorrectedFormat(timeFormat.format00),
    }),
    expression: Property.LongText({
      displayName: 'Expression',
      description: `Provide an expression to add or subtract using the following units (year , month , day , hour , minute or second).
             \nExamples:\n+ 2 second + 1 hour \n+ 1 year - 3 day - 2 month \n+ 5 minute`,
      required: true,
    }),
    timeZone: Property.StaticDropdown<string>({
      displayName: 'Time Zone',
      description: 'Optional: Set a timezone for the calculation to handle DST correctly',
      options: {
        options: timeZoneOptions,
      },
      required: false,
    }),
    setTime: Property.ShortText({
      displayName: 'Set Time To (24h format)',
      description: 'Optional: Set the result to a specific time (e.g., "10:00" or "14:30"). This allows scheduling at a specific time after adding/subtracting dates. Leave empty to keep the calculated time.',
      required: false,
    }),
    useCurrentTime: Property.Checkbox({
      displayName: 'Use Current Time',
      description: 'If checked, the current time will be used instead of the time from "Set Time To" field.',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    // Ensure all dayjs plugins are properly extended
   
    
    const inputDate = context.propsValue.inputDate;
    const inputDateFormat = getCorrectedFormat(context.propsValue.inputDateFormat);
    const outputFormat = getCorrectedFormat(context.propsValue.outputFormat);
    const expression = context.propsValue.expression;
    const timeZone = context.propsValue.timeZone as string | undefined;
    const setTime = context.propsValue.setTime as string | undefined;
    const useCurrentTime = context.propsValue.useCurrentTime as boolean;

    if (setTime && setTime.trim() !== '') {
      await propsValidation.validateZod({ time: setTime }, {
        time: z.string().regex(/^\d\d:\d\d$/),
      });
    }

    const BeforeDate = parseDate(inputDate, inputDateFormat);
    let AfterDate = addSubtractTime(BeforeDate.toDate(), expression, timeZone);

    if (timeZone && (setTime || useCurrentTime)) {
      let timeToSet = setTime;
      
      if (useCurrentTime) {
        const now = apDayjs().tz(timeZone);
        timeToSet = `${now.hour().toString().padStart(2, '0')}:${now.minute().toString().padStart(2, '0')}`;
      }

      if (timeToSet && timeToSet.trim() !== '') {
        const [hours, minutes] = timeToSet.split(':').map(Number);
        
        if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
          throw new Error(
            `Invalid time value - hours: ${hours} (must be 0-23), minutes: ${minutes} (must be 0-59)`
          );
        }

        AfterDate = AfterDate.tz(timeZone).hour(hours).minute(minutes).second(0).millisecond(0);
      }
    }

    if (timeZone) {
      return { result: AfterDate.tz(timeZone).format(outputFormat) };
    } else {
      return { result: AfterDate.format(outputFormat) };
    }
  },
});

function addSubtractTime(date: Date, expression: string, timeZone?: string): dayjs.Dayjs {
  // remove all the spaces and line breaks from the expression
  expression = expression.replace(/(\r\n|\n|\r)/gm, '').replace(/ /g, '');
  const parts = expression.split(/(\+|-)/);
  let sign = 1;
  const numbers = [];
  const units = [];

  for (let i = 0; i < parts.length; i++) {
    if (parts[i] === '+') sign = 1;
    else if (parts[i] === '-') sign = -1;
    else if (parts[i] === '') continue;
    let number = '';
    let unit = '';
    for (let j = 0; j < parts[i].length; j++) {
      if (parts[i][j] === ' ') continue;
      if (parts[i][j] >= '0' && parts[i][j] <= '9') {
        if (unit !== '') {
          numbers.push(sign * parseInt(number));
          units.push(unit);
          number = '';
          unit = '';
        }
        number += parts[i][j];
      } else {
        if (number === '') continue;
        unit += parts[i][j];
      }
    }
    if (unit !== '') {
      numbers.push(sign * parseInt(number));
      units.push(unit);
    }
  }
  
  // Create timezone-aware dayjs object if timezone is provided
  let dayjsDate = timeZone ? apDayjs(date).tz(timeZone) : apDayjs(date);
  
  for (let i = 0; i < numbers.length; i++) {
    const val = units[i].toLowerCase() as timeParts;
    switch (val) {
      case timeParts.year:
        dayjsDate = dayjsDate.add(numbers[i], 'year');
        break;
      case timeParts.month:
        dayjsDate = dayjsDate.add(numbers[i], 'month');
        break;
      case timeParts.day:
        dayjsDate = dayjsDate.add(numbers[i], 'day');
        break;
      case timeParts.hour:
        dayjsDate = dayjsDate.add(numbers[i], 'hour');
        break;
      case timeParts.minute:
        dayjsDate = dayjsDate.add(numbers[i], 'minute');
        break;
      case timeParts.second:
        dayjsDate = dayjsDate.add(numbers[i], 'second');
        break;
      case timeParts.dayOfWeek:
      case timeParts.monthName:
      case timeParts.unix_time:
        break;
      default: {
        const nvr: never = val;
        console.error(nvr, 'unhandled case was reached');
      }
    }
  }
  return dayjsDate;
}
