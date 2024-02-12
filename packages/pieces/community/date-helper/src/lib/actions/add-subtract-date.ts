import { Property, createAction } from '@activepieces/pieces-framework';
import {
  addSubtractTime,
  optionalTimeFormats,
  timeFormat,
  timeFormatDescription,
  createNewDate,
  getDateInformation,
} from '../common';

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
      defaultValue: timeFormat.format00,
    }),
    outputFormat: Property.StaticDropdown({
      displayName: 'To Time Format',
      description: timeFormatDescription,
      options: {
        options: optionalTimeFormats,
      },
      required: true,
      defaultValue: timeFormat.format00,
    }),
    expression: Property.LongText({
      displayName: 'Expression',
      description: `Provide an expression to add or subtract using the following units 
            <b>( year , month , day , hour , minute or second )</b> . <br>Examples:<br> +2 <b>second</b> +1 <b>hour</b> <br> + 1 <b>year</b> - 3 <b>day</b> - 2 <b>month</b> <br> + 5 <b>minute</b>`,
      required: true,
    }),
  },
  async run(context) {
    const inputDate = context.propsValue.inputDate;
    if (typeof inputDate !== 'string') {
      throw new Error(
        `Input date is not a string \ninput date: ${JSON.stringify(inputDate)}`
      );
    }
    const inputDateFormat = context.propsValue.inputDateFormat;
    if (typeof inputDateFormat !== 'string') {
      throw new Error(
        `Input format is not a string \ninput format: ${JSON.stringify(
          inputDate
        )}`
      );
    }
    const outputFormat = context.propsValue.outputFormat;
    if (typeof outputFormat !== 'string') {
      throw new Error(
        `Output format is not a string \noutput format: ${JSON.stringify(
          inputDate
        )}`
      );
    }
    const expression = context.propsValue.expression;
    if (typeof expression !== 'string') {
      throw new Error(
        `Expression is not a string \nexpression: ${JSON.stringify(inputDate)}`
      );
    }
    const DateInfo = getDateInformation(inputDate, inputDateFormat);
    const BeforeDate = new Date(
      DateInfo.year,
      DateInfo.month - 1,
      DateInfo.day,
      DateInfo.hour,
      DateInfo.minute,
      DateInfo.second
    );
    const AfterDate = addSubtractTime(BeforeDate, expression);

    return { result: createNewDate(AfterDate, outputFormat) };
  },
});
