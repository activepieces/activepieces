import { Property, createAction } from '@activepieces/pieces-framework';
import {
  optionalTimeFormats,
  parseDate,
  timeFormat,
  inputFormatDescription,
  outputFormatDescription,
  dateInputDescription,
  timeZoneOptions,
  getCorrectedFormat,
} from '../common';
import { formatDateActionOutputSchema } from '../output-schemas';

export const formatDateAction = createAction({
  audience: 'both',
  name: 'format_date',
  classification: 'READ',
  displayName: 'Format Date',
  description: 'Converts a date from one format to another',
  aiMetadata: { description: 'Converts a date string from one pattern and time zone into another in a single step. Pick this for a pure representation change; use Extract Date Units to pull components as data, Add/Subtract Time to move the date, and Date Difference to compare two dates. Requires the input date plus source and target format and zone; the source pattern is only a parsing hint (parsing falls back to lenient then native parsing) and the action throws if the value cannot be parsed at all, but is otherwise deterministic and idempotent.', idempotent: true },
  errorHandlingOptions: {
    continueOnFailure: {
      hide: true,
    },
    retryOnFailure: {
      hide: true,
    },
  },
  propertyGroups: [
    {
      key: 'input',
      display: 'section',
      label: 'Input',
      icon: 'calendar',
      props: ['inputDate', 'inputFormat', 'inputTimeZone'],
    },
    {
      key: 'output',
      display: 'section',
      label: 'Output',
      icon: 'type',
      props: ['outputFormat', 'outputTimeZone'],
    },
  ],
  props: {
    inputDate: Property.ShortText({
      displayName: 'Date',
      description: dateInputDescription,
      required: true,
    }),
    inputFormat: Property.StaticDropdown({
      displayName: 'Format',
      description: inputFormatDescription,
      options: {
        options: optionalTimeFormats,
      },
      required: true,
      defaultValue: timeFormat.format00,
    }),
    inputTimeZone: Property.StaticDropdown<string>({
      displayName: 'Time Zone',
      description: 'Time zone the date above is written in.',
      options: {
        options: timeZoneOptions,
      },
      required: true,
      defaultValue: 'UTC',
    }),
    outputFormat: Property.StaticDropdown({
      displayName: 'Format',
      description: outputFormatDescription,
      options: {
        options: optionalTimeFormats,
      },
      required: true,
      defaultValue: timeFormat.format00,
    }),
    outputTimeZone: Property.StaticDropdown<string>({
      displayName: 'Time Zone',
      description: 'Time zone to convert the result to.',
      options: {
        options: timeZoneOptions,
      },
      required: true,
      defaultValue: 'UTC',
    }),
  },
  outputSchema: formatDateActionOutputSchema,
  async run(context) {

    const inputDate = context.propsValue.inputDate;
    const inputFormat = getCorrectedFormat(context.propsValue.inputFormat);
    const inputTimeZone = context.propsValue.inputTimeZone as string;
    const outputFormat = getCorrectedFormat(context.propsValue.outputFormat);
    const outputTimeZone = context.propsValue.outputTimeZone as string;

    return {
      result: changeDateFormat(
        inputDate,
        inputFormat,
        inputTimeZone,
        outputFormat,
        outputTimeZone
      ),
    };
  },
});



function changeDateFormat(
  inputDate: string,
  inputFormat: string,
  inputTimeZone: string,
  outputFormat: string,
  outputTimeZone: string
): string {
  const parsedDate = parseDate(inputDate, inputFormat);
  
  return parsedDate.tz(inputTimeZone, true).tz(outputTimeZone).format(outputFormat);
}