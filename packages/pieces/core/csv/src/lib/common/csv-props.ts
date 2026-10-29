import { Property } from '@activepieces/pieces-framework';
import { AUTO_DELIMITER } from './csv-utils';

function csvText() {
  return Property.LongText({
    displayName: 'CSV Text',
    description:
      'Paste the CSV, or map CSV text from an earlier step. The first row must be the column names.',
    placeholder: 'name,email,city',
    required: true,
  });
}

function inputDelimiter() {
  return Property.StaticDropdown({
    displayName: 'Delimiter',
    description:
      'The character that separates columns. Auto-detect picks comma, semicolon, tab or pipe from the first rows.',
    required: false,
    defaultValue: AUTO_DELIMITER,
    options: {
      options: [{ label: 'Auto-detect', value: AUTO_DELIMITER }, ...DELIMITER_OPTIONS],
    },
  });
}

function outputDelimiter() {
  return Property.StaticDropdown({
    displayName: 'Delimiter',
    description:
      'The character that separates columns in the file. Many European Excel versions expect semicolons.',
    required: false,
    defaultValue: ',',
    options: { options: DELIMITER_OPTIONS },
  });
}

const DELIMITER_OPTIONS = [
  { label: 'Comma (,)', value: ',' },
  { label: 'Semicolon (;)', value: ';' },
  { label: 'Tab', value: '\t' },
  { label: 'Pipe (|)', value: '|' },
];

export const csvProps = {
  csvText,
  inputDelimiter,
  outputDelimiter,
};
