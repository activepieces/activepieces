import { isObject } from '@activepieces/shared';
import { t } from 'i18next';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';

import { OutputFieldList } from './output-field-list';
import { schemaUtils } from './resolve-schema';
import { truncateValue } from './shared-value-rendering';
import { OutputSchema } from './types';

function SchemaArrayItemRow({
  item,
  index,
  schema,
}: {
  item: unknown;
  index: number;
  schema: OutputSchema;
}) {
  const [expanded, setExpanded] = useState(false);

  const fallbackLabel = `${t('Item')} ${index + 1}`;
  const label =
    schema.itemLabel && isObject(item)
      ? schemaUtils.resolveTemplateLabel({
          value: item,
          template: schema.itemLabel,
          fallback: fallbackLabel,
        })
      : fallbackLabel;

  // A non-object item has no schema fields to expand into — show its value as a
  // static row instead of a clickable chevron that opens to nothing.
  if (!isObject(item)) {
    return (
      <div className="flex items-center gap-3 py-2 px-4 hover:bg-accent/50 border-b border-dividers last:border-b-0">
        <span className="text-sm font-medium text-muted-foreground shrink-0">
          {label}
        </span>
        <span className="text-sm text-foreground/70 truncate flex-1 min-w-0">
          {truncateValue(item)}
        </span>
      </div>
    );
  }

  return (
    <div className="border-b border-dividers last:border-b-0">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-3 py-2 px-4 hover:bg-accent/50 cursor-pointer w-full text-left"
      >
        <div className="shrink-0 w-4 h-4 flex items-center justify-center text-muted-foreground">
          {expanded ? (
            <ChevronDown className="h-3.5 w-3.5" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5" />
          )}
        </div>
        <span className="text-sm font-medium text-muted-foreground truncate">
          {label}
        </span>
      </button>
      {expanded && <OutputFieldList json={item} schema={schema} />}
    </div>
  );
}

function OutputSchemaArrayList({ items, schema }: OutputSchemaArrayListProps) {
  if (items.length === 0) {
    return (
      <div className="p-4 text-sm text-muted-foreground italic">
        {t('empty')}
      </div>
    );
  }

  return (
    <div>
      {items.map((item, idx) => (
        <SchemaArrayItemRow key={idx} item={item} index={idx} schema={schema} />
      ))}
    </div>
  );
}

export { OutputSchemaArrayList };

type OutputSchemaArrayListProps = {
  items: unknown[];
  schema: OutputSchema;
};
