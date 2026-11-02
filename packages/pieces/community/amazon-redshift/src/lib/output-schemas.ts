import { OutputSchema } from '@activepieces/pieces-framework';

export const insertRowsOutputSchema: OutputSchema = {
  fields: [{ key: 'rowCount', label: 'Inserted Row Count', format: 'number' }],
};

export const updateRowsOutputSchema: OutputSchema = {
  fields: [{ key: 'rowCount', label: 'Updated Row Count', format: 'number' }],
};

export const deleteRowsOutputSchema: OutputSchema = {
  fields: [{ key: 'rowCount', label: 'Deleted Row Count', format: 'number' }],
};

export const findRowsOutputSchema: OutputSchema = {
  fields: [
    { key: 'rows', label: 'Rows', description: "The matching rows; each row's fields are the columns of the table." },
    { key: 'rowCount', label: 'Row Count', format: 'number' },
  ],
};

export const newRowOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'row',
      label: 'Row',
      value: '',
      dynamicKey: true,
      description: 'One new row of the table you selected, with every column it has. Date and time columns arrive as text, exactly as Redshift stores them.',
    },
  ],
};

export const newOrUpdatedRowOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'row',
      label: 'Row',
      value: '',
      dynamicKey: true,
      description: 'One new or updated row of the table you selected, with every column it has. Date and time columns arrive as text, exactly as Redshift stores them.',
    },
  ],
};

export const runQueryOutputSchema: OutputSchema = {
  fields: [
    { key: 'rows', label: 'Rows', description: 'The rows the query returned. Empty for INSERT, UPDATE, DELETE and DDL.' },
    { key: 'rowCount', label: 'Row Count', description: 'Rows returned, or rows changed by INSERT, UPDATE or DELETE.', format: 'number' },
  ],
};
