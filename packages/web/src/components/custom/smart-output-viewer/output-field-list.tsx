import { OutputFieldRow } from './output-field-row';
import { OutputDisplayHints } from './types';

type OutputFieldListProps = {
  json: Record<string, unknown>;
  hints: OutputDisplayHints;
};

function OutputFieldList({ json, hints }: OutputFieldListProps) {
  const fields = hints.fields ?? [];

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
