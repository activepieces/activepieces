import { Property, createAction } from '@activepieces/pieces-framework';

export const jsonToAsciiTable = createAction({
  description: 'Convert a list of items to a text table',
  displayName: 'List to Text Table',
  name: 'json_to_ascii_table',
  errorHandlingOptions: {
    continueOnFailure: {
      hide: true,
    },
    retryOnFailure: {
      hide: true,
    },
  },
  props: {
    data: Property.Json({
      displayName: 'List',
      description: 'List of items to convert to a text table',
      required: true,
    }),
  },
  run: async (ctx) => {
    const data = ctx.propsValue.data;

    // Validate input is an array
    if (!Array.isArray(data)) {
      throw new Error('Input must be an array of objects');
    }

    if (data.length === 0) {
      return '';
    }

    // Get all unique keys from all objects
    const keys = Array.from(
      new Set(data.flatMap((obj) => Object.keys(obj)))
    );

    // Calculate column widths
    const columnWidths = keys.map((key) => {
      const maxDataWidth = Math.max(
        ...data.map((row) => String(row[key] ?? '').length)
      );
      return Math.max(key.length, maxDataWidth);
    });

    // Create separator line
    const separator =
      '+' +
      columnWidths.map((width) => '-'.repeat(width + 2)).join('+') +
      '+';

    // Create header row
    const header =
      '|' +
      keys
        .map((key, i) => ' ' + key.padEnd(columnWidths[i]) + ' ')
        .join('|') +
      '|';

    // Create data rows
    const rows = data.map((row) => {
      return (
        '|' +
        keys
          .map((key, i) => {
            const value = String(row[key] ?? '');
            return ' ' + value.padEnd(columnWidths[i]) + ' ';
          })
          .join('|') +
        '|'
      );
    });

    // Combine all parts
    return [separator, header, separator, ...rows, separator].join('\n');
  },
});