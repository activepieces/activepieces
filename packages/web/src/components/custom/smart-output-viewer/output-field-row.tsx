import { isNil, isObject } from '@activepieces/shared';
import { t } from 'i18next';
import { ChevronDown, ChevronRight, Info } from 'lucide-react';
import { useState } from 'react';

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
import { schemaUtils } from './resolve-schema';
import { formatKey, truncateValue, ValueRow } from './shared-value-rendering';
import { OutputSchemaField } from './types';

function ChildFieldRow({
  child,
  json,
  parentPath,
}: {
  child: OutputSchemaField;
  json: unknown;
  parentPath?: string;
}) {
  const path = schemaUtils.resolveFieldPath(child, parentPath);
  const childValue = getValueByDotPath(json, path);

  return (
    <div className="flex items-start gap-3 py-1.5 px-3 pl-10 hover:bg-accent/50">
      <span className="flex h-5 items-center shrink-0">
        <FieldTypeIcon value={childValue} format={child.format} />
      </span>
      <span className="text-sm text-muted-foreground min-w-[120px] max-w-[160px] shrink-0 truncate">
        {schemaUtils.resolveFieldLabel(child)}
      </span>
      <span className="flex-1 text-sm min-w-0">
        {isNil(childValue) || childValue === '' ? (
          <span className="text-muted-foreground italic">{t('empty')}</span>
        ) : (
          <FormatSingleValue
            value={childValue}
            format={child.format}
            currency={child.currency}
          />
        )}
      </span>
    </div>
  );
}

function ListItemRow({
  item,
  itemKey,
  itemLabel,
  itemChildren,
}: {
  item: unknown;
  itemKey: string;
  itemLabel: string;
  itemChildren: OutputSchemaField[];
}) {
  const [itemExpanded, setItemExpanded] = useState(false);

  if (itemChildren.length === 0) {
    return (
      <div className="flex items-start gap-3 py-1.5 px-3 pl-10 hover:bg-accent/50">
        <span className="text-sm text-muted-foreground min-w-[120px] max-w-[160px] shrink-0 truncate">
          {itemLabel}
        </span>
        <span className="flex-1 text-sm min-w-0 break-words whitespace-pre-wrap">
          {isNil(item) ? (
            <span className="text-muted-foreground italic">{t('empty')}</span>
          ) : typeof item === 'object' ? (
            JSON.stringify(item)
          ) : (
            String(item)
          )}
        </span>
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        className="flex items-center gap-3 py-1.5 px-3 pl-10 hover:bg-accent/50 cursor-pointer w-full text-left"
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
      </button>
      {itemExpanded && (
        <div>
          {itemChildren.map((child) => {
            const childValue = getValueByDotPath(
              item,
              schemaUtils.resolveItemFieldPath(child),
            );
            return (
              <div
                key={`${itemKey}-${child.key}`}
                className="flex items-start gap-3 py-1.5 px-3 pl-16 hover:bg-accent/50"
              >
                <span className="text-sm text-muted-foreground min-w-[100px] max-w-[140px] shrink-0 truncate">
                  {schemaUtils.resolveFieldLabel(child)}
                </span>
                <span className="flex-1 text-sm min-w-0">
                  {isNil(childValue) || childValue === '' ? (
                    <span className="text-muted-foreground italic">
                      {t('empty')}
                    </span>
                  ) : (
                    <FormatSingleValue
                      value={childValue}
                      format={child.format}
                      currency={child.currency}
                    />
                  )}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

function MatrixRow({
  row,
  rowKey,
  rowLabel,
  format,
  currency,
}: {
  row: unknown[];
  rowKey: string;
  rowLabel: string;
  format: OutputSchemaField['format'];
  currency: OutputSchemaField['currency'];
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <button
        type="button"
        className="flex items-center gap-3 py-1.5 px-3 pl-10 hover:bg-accent/50 cursor-pointer w-full text-left"
        onClick={() => setExpanded(!expanded)}
      >
        <span className="flex items-center gap-1 text-sm text-muted-foreground min-w-[120px] max-w-[160px] shrink-0">
          {expanded ? (
            <ChevronDown className="h-3 w-3 shrink-0" />
          ) : (
            <ChevronRight className="h-3 w-3 shrink-0" />
          )}
          <span className="truncate">{rowLabel}</span>
        </span>
      </button>
      {expanded && (
        <div>
          {row.map((cell, idx) => (
            <div
              key={`${rowKey}-${idx}`}
              className="flex items-start gap-3 py-1.5 px-3 pl-16 hover:bg-accent/50"
            >
              <span className="flex h-5 items-center shrink-0">
                <FieldTypeIcon value={cell} format={format} />
              </span>
              <span className="text-sm text-muted-foreground min-w-[100px] max-w-[140px] shrink-0 truncate">
                {t('Cell')} {idx + 1}
              </span>
              <span className="flex-1 text-sm min-w-0">
                {isNil(cell) || cell === '' ? (
                  <span className="text-muted-foreground italic">
                    {t('empty')}
                  </span>
                ) : (
                  <FormatSingleValue
                    value={cell}
                    format={format}
                    currency={currency}
                  />
                )}
              </span>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

function OutputFieldRow({ field, json }: OutputFieldRowProps) {
  const [expanded, setExpanded] = useState(false);

  const label = schemaUtils.resolveFieldLabel(field);
  const path = schemaUtils.resolveFieldPath(field);
  const value = getValueByDotPath(json, path);

  const isDynamicMap = field.dynamicKey === true && isObject(value);
  const dynamicEntries =
    isDynamicMap && isObject(value) ? Object.entries(value) : [];

  const children = field.children ?? [];
  const itemChildren = field.listItems ?? [];
  // A description only counts when it matches the value's actual shape, so a
  // field whose declared structure contradicts its runtime value (e.g. children
  // declared but the value is an array) falls through to the drill-down below.
  // This keeps the viewer and the data selector classifying inputs identically.
  const isDescribedList = itemChildren.length > 0 && Array.isArray(value);
  const isDescribedObject =
    !isDynamicMap && children.length > 0 && isObject(value);
  const innerDescribed = isDescribedList || isDescribedObject || isDynamicMap;

  // When the schema names the field but not its inner structure, show everything
  // inside it rather than dead-ending at a badge: matrices drill into rows/cells,
  // other containers fall back to the generic (schemaless) renderer. The schema
  // stays a whitelist at the top level — undescribed root siblings are not shown.
  const isMatrix = !innerDescribed && schemaUtils.isMatrixArray(value);
  const isPrimitiveList =
    !innerDescribed &&
    !isMatrix &&
    Array.isArray(value) &&
    value.length > 0 &&
    schemaUtils.isPrimitiveArray(value);
  const isGenericArray =
    !innerDescribed &&
    !isMatrix &&
    !isPrimitiveList &&
    Array.isArray(value) &&
    value.length > 0;
  const isGenericObject =
    !innerDescribed && isObject(value) && Object.keys(value).length > 0;

  const isExpandable =
    innerDescribed ||
    isMatrix ||
    isPrimitiveList ||
    isGenericArray ||
    isGenericObject;

  const listItems: unknown[] =
    isDescribedList && Array.isArray(value) ? value : [];
  const matrixRows: unknown[][] =
    isMatrix && schemaUtils.isMatrixArray(value) ? value : [];
  const primitiveItems: unknown[] =
    isPrimitiveList && Array.isArray(value) ? value : [];
  const genericArrayItems: unknown[] =
    isGenericArray && Array.isArray(value) ? value : [];
  const genericObjectEntries: Array<[string, unknown]> =
    isGenericObject && isObject(value) ? Object.entries(value) : [];

  return (
    <div className="border-b border-dividers last:border-b-0">
      <div className="flex items-start gap-3 py-2.5 px-3 hover:bg-accent/50">
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
              <FieldTypeIcon value={value} format={field.format} />
              <span className="truncate">{label}</span>
            </button>
          ) : (
            <span className="flex items-center gap-1 text-sm font-medium text-muted-foreground truncate">
              <FieldTypeIcon value={value} format={field.format} />
              {label}
            </span>
          )}
          {field.description && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0 cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-[300px]">
                  {field.description}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        <div className="flex-1 text-sm min-w-0">
          {isDescribedList || isMatrix ? (
            <span className="text-muted-foreground">
              {t('itemCount', {
                count: isMatrix ? matrixRows.length : listItems.length,
              })}
            </span>
          ) : expanded ? null : isDescribedObject ||
            isDynamicMap ||
            isGenericObject ? (
            <span
              className="text-muted-foreground truncate"
              title={
                isNil(value) || typeof value !== 'object'
                  ? undefined
                  : JSON.stringify(value)
              }
            >
              {isDynamicMap
                ? t('fieldCount', { count: dynamicEntries.length })
                : truncateValue(value)}
            </span>
          ) : (
            <FormatValue value={value} field={field} />
          )}
        </div>
      </div>

      {expanded && isDynamicMap && (
        <div className="pb-1">
          {dynamicEntries.map(([entryKey, entryValue]) => {
            const quotedKey = entryKey
              .replace(/\\/g, '\\\\')
              .replace(/"/g, '\\"');
            return (
              <ChildFieldRow
                key={entryKey}
                child={{
                  key: entryKey,
                  label: schemaUtils.resolveEntryLabel({
                    value: entryValue,
                    labelKey: field.labelKey,
                    fallback: entryKey,
                  }),
                  value: `${path}["${quotedKey}"]`,
                }}
                json={json}
              />
            );
          })}
        </div>
      )}

      {expanded && isDescribedObject && (
        <div className="pb-1">
          {children.map((child) => (
            <ChildFieldRow
              key={child.key}
              child={child}
              json={json}
              parentPath={path}
            />
          ))}
        </div>
      )}

      {expanded && isDescribedList && (
        <div className="pb-1">
          {listItems.map((item, idx) => (
            <ListItemRow
              key={`${path}-${idx}`}
              itemKey={`${path}-${idx}`}
              item={item}
              itemLabel={schemaUtils.resolveEntryLabel({
                value: item,
                labelKey: field.labelKey,
                fallback: `${label} ${idx + 1}`,
              })}
              itemChildren={itemChildren}
            />
          ))}
        </div>
      )}

      {expanded && isMatrix && (
        <div className="pb-1">
          {matrixRows.map((row, idx) => (
            <MatrixRow
              key={`${path}-${idx}`}
              rowKey={`${path}-${idx}`}
              row={row}
              rowLabel={`${t('Row')} ${idx + 1}`}
              format={field.format}
              currency={field.currency}
            />
          ))}
        </div>
      )}

      {expanded && isGenericArray && (
        <div className="pb-1">
          {genericArrayItems.map((item, idx) => (
            <ValueRow
              key={`${path}-${idx}`}
              label={`${t('Item')} ${idx + 1}`}
              value={item}
              depth={0}
            />
          ))}
        </div>
      )}

      {expanded && isGenericObject && (
        <div className="pb-1">
          {genericObjectEntries.map(([entryKey, entryValue]) => (
            <ValueRow
              key={entryKey}
              label={formatKey(entryKey)}
              value={entryValue}
              depth={0}
            />
          ))}
        </div>
      )}

      {expanded && isPrimitiveList && (
        <div className="pb-1">
          {primitiveItems.map((item, idx) => (
            <div
              key={`${path}-${idx}`}
              className="flex items-start gap-3 py-1.5 px-3 pl-10 hover:bg-accent/50"
            >
              <span className="flex h-5 items-center shrink-0">
                <FieldTypeIcon value={item} format={field.format} />
              </span>
              <span className="text-sm text-muted-foreground min-w-[120px] max-w-[160px] shrink-0 truncate">
                {`${label} ${idx + 1}`}
              </span>
              <span className="flex-1 text-sm min-w-0 break-words whitespace-pre-wrap">
                {isNil(item) || item === '' ? (
                  <span className="text-muted-foreground italic">
                    {t('empty')}
                  </span>
                ) : (
                  <FormatSingleValue
                    value={item}
                    format={field.format}
                    currency={field.currency}
                  />
                )}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export { OutputFieldRow };

type OutputFieldRowProps = {
  field: OutputSchemaField;
  json: unknown;
};
