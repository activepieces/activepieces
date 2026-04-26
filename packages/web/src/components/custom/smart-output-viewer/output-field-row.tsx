import { isNil } from '@activepieces/shared';
import { t } from 'i18next';
import { ChevronDown, ChevronRight, Copy, Info } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

import { FieldTypeIcon } from './field-type-icon';
import {
  FormatSingleValue,
  FormatValue,
  getValueByDotPath,
} from './format-value';
import { hintUtils } from './resolve-hints';
import { truncateValue } from './shared-value-rendering';
import { HintField } from './types';

type OutputFieldRowProps = {
  field: HintField;
  json: unknown;
};

function CopyButton({ value }: { value: unknown }) {
  const handleCopy = () => {
    const text =
      typeof value === 'object'
        ? JSON.stringify(value, null, 2)
        : String(value ?? '');
    navigator.clipboard.writeText(text);
    toast.success(t('Copied'), { duration: 1000 });
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      className="opacity-0 group-hover:opacity-100 shrink-0 h-6 w-6 p-0"
      onClick={handleCopy}
    >
      <Copy className="h-3.5 w-3.5" />
    </Button>
  );
}

function ChildFieldRow({
  child,
  json,
  parentPath,
}: {
  child: HintField;
  json: unknown;
  parentPath?: string;
}) {
  const path = hintUtils.resolveFieldPath(child, parentPath);
  const childValue = getValueByDotPath(json, path);

  return (
    <div className="group flex items-center gap-3 py-1.5 px-3 pl-10 hover:bg-accent/50">
      <FieldTypeIcon value={childValue} format={child.f} />
      <span className="text-sm text-muted-foreground min-w-[120px] max-w-[160px] shrink-0 truncate">
        {hintUtils.resolveFieldLabel(child)}
      </span>
      <span className="flex-1 text-sm min-w-0">
        {isNil(childValue) || childValue === '' ? (
          <span className="text-muted-foreground italic">{t('empty')}</span>
        ) : (
          <FormatSingleValue value={childValue} format={child.f} />
        )}
      </span>
      <CopyButton value={childValue} />
    </div>
  );
}

function ListItemRow({
  item,
  itemLabel,
  itemChildren,
}: {
  item: unknown;
  itemLabel: string;
  itemChildren: HintField[];
}) {
  const [itemExpanded, setItemExpanded] = useState(false);

  if (itemChildren.length === 0) {
    return (
      <div className="group flex items-center gap-3 py-1.5 px-3 pl-10 hover:bg-accent/50">
        <span className="text-sm text-muted-foreground min-w-[120px] max-w-[160px] shrink-0 truncate">
          {itemLabel}
        </span>
        <span className="flex-1 text-sm min-w-0 break-all">
          {isNil(item) ? (
            <span className="text-muted-foreground italic">{t('empty')}</span>
          ) : typeof item === 'object' ? (
            JSON.stringify(item)
          ) : (
            String(item)
          )}
        </span>
        <CopyButton value={item} />
      </div>
    );
  }

  return (
    <>
      <div
        className="group flex items-center gap-3 py-1.5 px-3 pl-10 hover:bg-accent/50 cursor-pointer"
        onClick={() => setItemExpanded(!itemExpanded)}
      >
        <span className="flex items-center gap-1 text-sm text-muted-foreground min-w-[120px] max-w-[160px] shrink-0">
          {itemExpanded ? (
            <ChevronDown className="h-3 w-3 shrink-0" />
          ) : (
            <ChevronRight className="h-3 w-3 shrink-0" />
          )}
          <span className="truncate">{itemLabel}</span>
        </span>
      </div>
      {itemExpanded && (
        <div>
          {itemChildren.map((child) => {
            const childValue = getValueByDotPath(
              item,
              hintUtils.resolveItemFieldPath(child),
            );
            return (
              <div
                key={child.k}
                className="group flex items-center gap-3 py-1.5 px-3 pl-16 hover:bg-accent/50"
              >
                <span className="text-sm text-muted-foreground min-w-[100px] max-w-[140px] shrink-0 truncate">
                  {hintUtils.resolveFieldLabel(child)}
                </span>
                <span className="flex-1 text-sm min-w-0">
                  {isNil(childValue) || childValue === '' ? (
                    <span className="text-muted-foreground italic">
                      {t('empty')}
                    </span>
                  ) : (
                    <FormatSingleValue value={childValue} format={child.f} />
                  )}
                </span>
                <CopyButton value={childValue} />
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

function OutputFieldRow({ field, json }: OutputFieldRowProps) {
  const [expanded, setExpanded] = useState(false);

  const label = hintUtils.resolveFieldLabel(field);
  const path = hintUtils.resolveFieldPath(field);
  const value = getValueByDotPath(json, path);

  const isDynamicMap =
    field.dk === true &&
    !isNil(value) &&
    typeof value === 'object' &&
    !Array.isArray(value);
  const dynamicEntries = isDynamicMap
    ? Object.entries(value as Record<string, unknown>)
    : [];

  const children = field.c ?? [];
  const itemChildren = field.li ?? [];
  const hasChildren = children.length > 0 || dynamicEntries.length > 0;
  const isList = itemChildren.length > 0 && Array.isArray(value);
  const isExpandable = hasChildren || isList;
  const listItems = isList ? (value as unknown[]) : [];

  return (
    <div className="border-b border-dividers last:border-b-0">
      <div className="group flex items-start gap-3 py-2.5 px-3 hover:bg-accent/50">
        <div className="flex items-center gap-1.5 min-w-[140px] max-w-[180px] shrink-0 pt-0.5">
          {isExpandable ? (
            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1 text-sm font-medium text-muted-foreground"
            >
              {expanded ? (
                <ChevronDown className="h-3.5 w-3.5 shrink-0" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5 shrink-0" />
              )}
              <FieldTypeIcon value={value} format={field.f} />
              <span className="truncate">{label}</span>
            </button>
          ) : (
            <span className="flex items-center gap-1 text-sm font-medium text-muted-foreground truncate">
              <FieldTypeIcon value={value} format={field.f} />
              {label}
            </span>
          )}
          {field.d && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0 cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-[300px]">
                  {field.d}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        <div className="flex-1 text-sm min-w-0">
          {isList ? (
            <span className="text-muted-foreground">
              {listItems.length} {t('items')}
            </span>
          ) : hasChildren && !expanded ? (
            <span
              className="text-muted-foreground truncate"
              title={
                isNil(value) || typeof value !== 'object'
                  ? undefined
                  : JSON.stringify(value)
              }
            >
              {isDynamicMap
                ? `${dynamicEntries.length} ${t('fields')}`
                : truncateValue(value)}
            </span>
          ) : hasChildren && expanded ? null : (
            <FormatValue value={value} field={field} />
          )}
        </div>
        {!isExpandable && <CopyButton value={value} />}
      </div>

      {expanded && isDynamicMap && (
        <div className="pb-1">
          {dynamicEntries.map(([key]) => {
            const quotedKey = key.replace(/"/g, '\\"');
            return (
              <ChildFieldRow
                key={key}
                child={{
                  k: key,
                  l: key,
                  v: `${path}["${quotedKey}"]`,
                }}
                json={json}
              />
            );
          })}
        </div>
      )}

      {expanded && !isDynamicMap && children.length > 0 && (
        <div className="pb-1">
          {children.map((child) => (
            <ChildFieldRow
              key={child.k}
              child={child}
              json={json}
              parentPath={path}
            />
          ))}
        </div>
      )}

      {expanded && isList && (
        <div className="pb-1">
          {listItems.map((item, idx) => (
            <ListItemRow
              key={idx}
              item={item}
              itemLabel={`${label} ${idx + 1}`}
              itemChildren={itemChildren}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export { OutputFieldRow };
