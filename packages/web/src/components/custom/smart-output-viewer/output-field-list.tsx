import { OutputFieldRow } from './output-field-row';
import { OutputSchema } from './types';

type OutputFieldListProps = {
  json: Record<string, unknown>;
  schema: OutputSchema;
};

function OutputFieldList({ json, schema }: OutputFieldListProps) {
  const fields = schema.fields ?? [];

  if (fields.length === 0) return null;

  return (
    <div className="divide-y divide-dividers">
      {fields.map((field) => (
        <OutputFieldRow key={field.key} field={field} json={json} />
      ))}
    </div>
  );
}

export { OutputFieldList };
