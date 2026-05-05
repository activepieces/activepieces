import { OutputFieldRow } from './output-field-row';
import { hintUtils } from './resolve-hints';
import { OutputDisplayHints } from './types';

type OutputFieldListProps = {
  json: Record<string, unknown>;
  hints: OutputDisplayHints;
};

function OutputFieldList({ json, hints }: OutputFieldListProps) {
  const { hero, secondary } = hintUtils.visibleFields(hints);
  const allFields = [...hero, ...secondary];

  if (allFields.length === 0) return null;

  return (
    <div className="divide-y divide-dividers">
      {allFields.map((field) => (
        <OutputFieldRow key={field.key} field={field} json={json} />
      ))}
    </div>
  );
}

export { OutputFieldList };
