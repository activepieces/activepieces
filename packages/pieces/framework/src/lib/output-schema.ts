export type FieldFormat =
  | 'email'
  | 'url'
  | 'date'
  | 'datetime'
  | 'number'
  | 'boolean'
  | 'image'
  | 'html'
  | 'currency'
  | 'filesize'
  | 'duration';

export type OutputSchemaField = {
  key: string;
  label?: string;
  value?: string;
  format?: FieldFormat;
  description?: string;
  dynamicKey?: boolean;
  currency?: string;
  children?: OutputSchemaField[];
  listItems?: OutputSchemaField[];
};

export type OutputSchema = {
  fields: OutputSchemaField[];
};
