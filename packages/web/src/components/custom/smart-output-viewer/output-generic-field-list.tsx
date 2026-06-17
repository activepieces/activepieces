import { t } from 'i18next';

import { formatKey, ValueRow } from './shared-value-rendering';

type OutputGenericFieldListProps = {
  json: Record<string, unknown>;
};

function OutputGenericFieldList({ json }: OutputGenericFieldListProps) {
  const entries = Object.entries(json);

  if (entries.length === 0) {
    return (
      <div className="p-4 text-sm text-muted-foreground italic">
        {t('empty')}
      </div>
    );
  }

  return (
    <div className="py-1">
      {entries.map(([key, value]) => (
        <ValueRow key={key} label={formatKey(key)} value={value} depth={0} />
      ))}
    </div>
  );
}

export { OutputGenericFieldList };
