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

export type HintField = {
  key: string;
  label?: string;
  value?: string;
  format?: FieldFormat;
  description?: string;
  dynamicKey?: boolean;
  currency?: string;
  children?: HintField[];
  listItems?: HintField[];
};

export type OutputDisplayHints = {
  fields: HintField[];
};
