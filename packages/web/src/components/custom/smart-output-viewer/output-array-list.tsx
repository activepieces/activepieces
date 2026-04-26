import { isNil } from '@activepieces/shared';
import { t } from 'i18next';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';

import {
  CopyButton,
  formatKey,
  truncateValue,
  ValueRow,
} from './shared-value-rendering';

function ArrayItemRow({ item, index }: { item: unknown; index: number }) {
  const [expanded, setExpanded] = useState(false);

  if (isNil(item) || typeof item !== 'object' || Array.isArray(item)) {
    return (
      <div className="group flex items-center gap-3 py-2 px-4 hover:bg-accent/50 border-b border-dividers last:border-b-0">
        <span className="text-sm font-medium text-muted-foreground shrink-0">
          {t('Item')} {index + 1}
        </span>
        <span className="text-sm text-foreground/70 truncate flex-1">
          {truncateValue(item)}
        </span>
        <CopyButton value={item} />
      </div>
    );
  }

  const entries = Object.entries(item as Record<string, unknown>);
  const previewValues = entries
    .slice(0, 3)
    .map(([, v]) => truncateValue(v))
    .filter(Boolean)
    .join(' · ');

  return (
    <div className="border-b border-dividers last:border-b-0">
      <div
        onClick={() => setExpanded(!expanded)}
        className="group flex items-center gap-3 py-2 px-4 hover:bg-accent/50 cursor-pointer"
      >
        <div className="shrink-0 w-4 h-4 flex items-center justify-center text-muted-foreground">
          {expanded ? (
            <ChevronDown className="h-3.5 w-3.5" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5" />
          )}
        </div>
        <span className="text-sm font-medium text-muted-foreground shrink-0">
          {t('Item')} {index + 1}
        </span>
        {!expanded && (
          <span
            className="text-sm text-foreground/50 truncate flex-1 min-w-0"
            title={previewValues}
          >
            {previewValues}
          </span>
        )}
      </div>
      {expanded && (
        <div className="pb-1">
          {entries.map(([key, value]) => (
            <ValueRow
              key={key}
              label={formatKey(key)}
              value={value}
              depth={0}
            />
          ))}
        </div>
      )}
    </div>
  );
}

type OutputArrayListProps = {
  items: unknown[];
};

function OutputArrayList({ items }: OutputArrayListProps) {
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
        <ArrayItemRow key={idx} item={item} index={idx} />
      ))}
    </div>
  );
}

export { OutputArrayList };
