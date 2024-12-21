import { Property, createAction } from '@activepieces/pieces-framework';
import dayjs from 'dayjs';
import advancedFormat from 'dayjs/plugin/advancedFormat';
import {
  getCorrectedFormat,
  optionalTimeFormats,
  parseDate,
  timeFormat,
  timeFormatDescription,
  timeParts,
} from '../common';

dayjs.extend(advancedFormat);

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
  },
  async run(context) {
    const inputDate = context.propsValue.inputDate;
    const inputDateFormat = getCorrectedFormat(context.propsValue.inputDateFormat);
    const outputFormat = context.propsValue.outputFormat;
    const expression = context.propsValue.expression;
    const BeforeDate = parseDate(inputDate, inputDateFormat);
    const AfterDate = addSubtractTime(BeforeDate.toDate(), expression);
    return { result: dayjs(AfterDate).format(outputFormat) };
  },
});

function addSubtractTime(date: Date, expression: string) {
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
  let dayjsDate = dayjs(date);
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
  return dayjsDate.toDate();
}
