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
import { FormatValue, getValueByDotPath } from './format-value';
import { schemaUtils } from './resolve-schema';
import { formatKey, truncateValue, ValueRow } from './shared-value-rendering';
import { OutputSchemaField } from './types';

const NESTED_BASE_PADDING = 40;
const NESTED_PADDING_STEP = 24;

function nestedPaddingLeft(depth: number): number {
  return NESTED_BASE_PADDING + (depth - 1) * NESTED_PADDING_STEP;
}

// A field's structure only "counts" when it matches the value's actual runtime
// shape, so a schema whose declared structure contradicts the value (e.g.
// children declared but the value is an array) falls through to the drill-down.
// The viewer and the data selector classify inputs identically this way.
function classifyField(field: OutputSchemaField, value: unknown) {
  const isDynamicMap = field.dynamicKey === true && isObject(value);
  const children = field.children ?? [];
  const itemChildren = field.listItems ?? [];
  const isDescribedList = itemChildren.length > 0 && Array.isArray(value);
  const isDescribedObject =
    !isDynamicMap && children.length > 0 && isObject(value);
  const innerDescribed = isDescribedList || isDescribedObject || isDynamicMap;
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
  return {
    isDynamicMap,
    children,
    itemChildren,
    isDescribedList,
    isDescribedObject,
    isMatrix,
    isPrimitiveList,
    isGenericArray,
    isGenericObject,
    isExpandable,
  };
}

function SchemaListItemRow({
  item,
  itemLabel,
  itemChildren,
  depth,
}: {
  item: unknown;
  itemLabel: string;
  itemChildren: OutputSchemaField[];
  depth: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const paddingLeft = nestedPaddingLeft(depth);

  if (itemChildren.length === 0) {
    return (
      <div
        className="flex items-start gap-3 py-1.5 pr-3 hover:bg-accent/50"
        style={{ paddingLeft }}
      >
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
        className="flex items-center gap-3 py-1.5 pr-3 hover:bg-accent/50 cursor-pointer w-full text-left"
        style={{ paddingLeft }}
        onClick={() => setExpanded(!expanded)}
      >
        <span className="flex items-center gap-1 text-sm text-muted-foreground min-w-[120px] max-w-[160px] shrink-0">
          {expanded ? (
            <ChevronDown className="h-3 w-3 shrink-0" />
          ) : (
            <ChevronRight className="h-3 w-3 shrink-0" />
          )}
          <span className="truncate">{itemLabel}</span>
        </span>
      </button>
      {expanded && (
        <div>
          {/* Resolve each item field against the item itself, so a listItem that
              is a nested object/array drills in instead of dead-ending. */}
          {itemChildren.map((child) => (
            <SchemaFieldRow
              key={child.key}
              field={child}
              json={item}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </>
  );
}

function SchemaMatrixRow({
  row,
  rowKey,
  rowLabel,
  format,
  currency,
  depth,
}: {
  row: unknown[];
  rowKey: string;
  rowLabel: string;
  format: OutputSchemaField['format'];
  currency: OutputSchemaField['currency'];
  depth: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const rowPadding = nestedPaddingLeft(depth);
  const cellPadding = nestedPaddingLeft(depth + 1);

  return (
    <>
      <button
        type="button"
        className="flex items-center gap-3 py-1.5 pr-3 hover:bg-accent/50 cursor-pointer w-full text-left"
        style={{ paddingLeft: rowPadding }}
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
              key={`${rowKey}_cell_${idx}`}
              className="flex items-start gap-3 py-1.5 pr-3 hover:bg-accent/50"
              style={{ paddingLeft: cellPadding }}
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
                  <FormatValue
                    value={cell}
                    field={{ key: 'cell', format, currency }}
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

// A single schema field rendered at an arbitrary nesting depth. It recurses into
// described objects/lists (and undescribed containers) so deeply-described
// schemas — e.g. message.from.id — drill all the way down instead of stringifying
// a nested object to "[object Object]". `json` is the value scope this field
// resolves against (the root output at depth 0, the parent object/list-item below),
// matching how the data selector switches `sampleData` as it recurses.
function SchemaFieldRow({ field, json, depth }: SchemaFieldRowProps) {
  const [expanded, setExpanded] = useState(false);

  const label = schemaUtils.resolveFieldLabel(field);
  const path = schemaUtils.resolveItemFieldPath(field);
  const value = getValueByDotPath(json, path);

  const {
    isDynamicMap,
    children,
    itemChildren,
    isDescribedList,
    isDescribedObject,
    isMatrix,
    isPrimitiveList,
    isGenericArray,
    isGenericObject,
    isExpandable,
  } = classifyField(field, value);

  const dynamicEntries =
    isDynamicMap && isObject(value) ? Object.entries(value) : [];
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

  const isTop = depth === 0;
  const rowPaddingLeft = isTop ? 12 : nestedPaddingLeft(depth);
  const labelWidth = isTop
    ? 'min-w-[140px] max-w-[180px]'
    : 'min-w-[120px] max-w-[160px]';
  const labelWeight = isTop ? 'font-medium' : '';

  return (
    <div className={isTop ? 'border-b border-dividers last:border-b-0' : ''}>
      <div
        className={`flex items-start gap-3 ${
          isTop ? 'py-2.5' : 'py-1.5'
        } pr-3 hover:bg-accent/50`}
        style={{ paddingLeft: rowPaddingLeft }}
      >
        <div
          className={`flex items-center gap-1.5 ${labelWidth} shrink-0 pt-0.5`}
        >
          {isExpandable ? (
            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              className={`flex items-center gap-1 text-sm ${labelWeight} text-muted-foreground min-w-0`}
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
            <span
              className={`flex items-center gap-1 text-sm ${labelWeight} text-muted-foreground truncate`}
            >
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
              <SchemaFieldRow
                key={entryKey}
                field={{
                  key: entryKey,
                  label: schemaUtils.resolveEntryLabel({
                    value: entryValue,
                    labelKey: field.labelKey,
                    fallback: entryKey,
                  }),
                  value: `["${quotedKey}"]`,
                }}
                json={value}
                depth={depth + 1}
              />
            );
          })}
        </div>
      )}

      {expanded && isDescribedObject && (
        <div className="pb-1">
          {/* Resolve children against this field's value, so a child that is
              itself a described object/list drills in recursively. */}
          {children.map((child) => (
            <SchemaFieldRow
              key={child.key}
              field={child}
              json={value}
              depth={depth + 1}
            />
          ))}
        </div>
      )}

      {expanded && isDescribedList && (
        <div className="pb-1">
          {listItems.map((item, idx) => (
            <SchemaListItemRow
              key={`${path}_item_${idx}`}
              item={item}
              itemLabel={schemaUtils.resolveEntryLabel({
                value: item,
                labelKey: field.labelKey,
                fallback: `${label} ${idx + 1}`,
              })}
              itemChildren={itemChildren}
              depth={depth + 1}
            />
          ))}
        </div>
      )}

      {expanded && isMatrix && (
        <div className="pb-1">
          {matrixRows.map((row, idx) => (
            <SchemaMatrixRow
              key={`${path}_row_${idx}`}
              rowKey={`${path}_row_${idx}`}
              row={row}
              rowLabel={`${t('Row')} ${idx + 1}`}
              format={field.format}
              currency={field.currency}
              depth={depth + 1}
            />
          ))}
        </div>
      )}

      {expanded && isGenericArray && (
        <div className="pb-1">
          {genericArrayItems.map((item, idx) => (
            <ValueRow
              key={`${path}_item_${idx}`}
              label={`${t('Item')} ${idx + 1}`}
              value={item}
              depth={depth + 1}
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
              depth={depth + 1}
            />
          ))}
        </div>
      )}

      {expanded && isPrimitiveList && (
        <div className="pb-1">
          {primitiveItems.map((item, idx) => (
            <div
              key={`${path}_item_${idx}`}
              className="flex items-start gap-3 py-1.5 pr-3 hover:bg-accent/50"
              style={{ paddingLeft: nestedPaddingLeft(depth + 1) }}
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
                  <FormatValue
                    value={item}
                    field={{
                      key: 'item',
                      format: field.format,
                      currency: field.currency,
                    }}
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

function OutputFieldRow({ field, json }: OutputFieldRowProps) {
  return <SchemaFieldRow field={field} json={json} depth={0} />;
}

export { OutputFieldRow };

type SchemaFieldRowProps = {
  field: OutputSchemaField;
  json: unknown;
  depth: number;
};

type OutputFieldRowProps = {
  field: OutputSchemaField;
  json: unknown;
};
