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
  /**
   * For `dynamicKey` maps and `listItems` arrays, the property within each
   * entry/item whose value is shown as the entry/item label in the data
   * selector and output viewer. The inserted expression path is unaffected
   * (it still uses the opaque key / numeric index). Falls back to the raw
   * key / `Item N` when absent or empty.
   */
  labelKey?: string;
  currency?: string;
  children?: OutputSchemaField[];
  listItems?: OutputSchemaField[];
  /**
   * Marks this field's value as sensitive (e.g. a secret returned by a vault
   * piece). The engine redacts it to `**REDACTED**` in the step's persisted
   * run-log output before it's stored. Only supported for top-level fields
   * (resolved via `value` if set, otherwise `key`) — a nested/dot-path
   * `value` is not redacted.
   */
  sensitive?: boolean;
};

export type OutputSchema = {
  fields: OutputSchemaField[];
  /**
   * Used when the step output is a top-level array: a template for labelling
   * each item, with `{dotPath}` placeholders resolved against that item
   * (e.g. `{key}: {fields.summary}`). Falls back to `Item N` when the template
   * resolves to an empty string. When the output is an object, this is ignored
   * and each `fields` entry is resolved against the object as usual.
   */
  itemLabel?: string;
};
