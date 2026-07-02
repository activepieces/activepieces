import { FieldType } from '@activepieces/shared';
import type {
  CellProps,
  CellTemplateProp,
  ColumnRegular,
  ColumnType,
  HyperFunc,
  RowHeaders,
  VNode,
} from '@revolist/revogrid';
import DateColumnType from '@revolist/revogrid-column-date';
import NumberColumnType from '@revolist/revogrid-column-numeral';
import SelectColumnType from '@revolist/revogrid-column-select';
import { useMemo } from 'react';

import {
  ApTableStore,
  ClientField,
  ClientRecordData,
} from '../stores/store/ap-tables-client-state';
import { Row } from '../types/types';
import { tableColors } from '../utils/table-colors';

import { useOptionalTableStore } from './ap-table-state-provider';

const COLUMN_TYPE_BY_FIELD: Partial<Record<FieldType, string>> = {
  [FieldType.NUMBER]: 'numeric',
  [FieldType.DATE]: 'date',
  [FieldType.STATIC_DROPDOWN]: 'select',
};

// Lucide glyph paths mirrored as native SVG VNodes (header runs in Stencil hyperscript,
// not React, so we can't mount the Lucide components — keep them visually identical).
const TYPE_ICON_PATHS: Record<FieldType, string[]> = {
  [FieldType.TEXT]: ['M4 7V4h16v3', 'M9 20h6', 'M12 4v16'],
  [FieldType.NUMBER]: ['M4 9h16', 'M4 15h16', 'M10 3 8 21', 'M16 3l-2 18'],
  [FieldType.DATE]: [
    'M8 2v4',
    'M16 2v4',
    'M3 10h18',
    'M3 6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z',
  ],
  [FieldType.STATIC_DROPDOWN]: [
    'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z',
    'm16 10-4 4-4-4',
  ],
};

function joinClasses(classes: (string | false | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}

function typeIconVNode(h: HyperFunc<VNode>, type: FieldType): VNode {
  return h(
    'svg',
    {
      class: 'ap-th-type-icon',
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'currentColor',
      'stroke-width': '2',
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
    },
    TYPE_ICON_PATHS[type].map((d) => h('path', { d })),
  );
}

function buildDataCellProperties(
  field: ClientField,
  fieldIndex: number,
  store: ApTableStore,
): (props: CellTemplateProp) => CellProps {
  const isNumber = field.type === FieldType.NUMBER;
  return (props) => {
    const state = store.getState();
    const record = state.records[props.rowIndex];
    const uuid = record?.uuid;
    // Cell color wins over the row color; either maps to a soft-tint CSS class.
    const cellColor = record?.values.find(
      (value) => value.fieldIndex === fieldIndex,
    )?.color;
    const colorKey = cellColor ?? record?.color ?? null;
    return {
      class: joinClasses([
        isNumber && 'ap-num-cell',
        colorKey ? tableColors.cellClass[colorKey] : undefined,
        !!uuid && state.selectedRecords.has(uuid) && 'ap-row-selected',
      ]),
    };
  };
}

export function buildRowHeaders(store: ApTableStore): RowHeaders {
  const toggleRow = (recordUuid: string, checked: boolean) => {
    const state = store.getState();
    const next = new Set(state.selectedRecords);
    if (checked) {
      next.add(recordUuid);
    } else {
      next.delete(recordUuid);
    }
    state.setSelectedRecords(next);
  };
  const toggleAll = (checked: boolean) => {
    const state = store.getState();
    state.setSelectedRecords(
      checked ? new Set(state.records.map((record) => record.uuid)) : new Set(),
    );
  };
  return {
    prop: '__rownum',
    size: 56,
    cellProperties: (props) => ({
      class: joinClasses([
        'ap-gutter-cell',
        store
          .getState()
          .selectedRecords.has(
            store.getState().records[props.rowIndex]?.uuid ?? '',
          ) && 'ap-row-selected',
      ]),
    }),
    columnTemplate: (h: HyperFunc<VNode>) => {
      const state = store.getState();
      const allSelected =
        state.records.length > 0 &&
        state.selectedRecords.size === state.records.length;
      return h('div', { class: 'ap-gutter ap-gutter-header' }, [
        h('input', {
          class: 'ap-checkbox',
          type: 'checkbox',
          checked: allSelected,
          onChange: (e: Event) =>
            toggleAll((e.target as HTMLInputElement).checked),
        }),
      ]);
    },
    cellTemplate: (h: HyperFunc<VNode>, props: CellTemplateProp) => {
      const record = store.getState().records[props.rowIndex];
      const recordUuid = record?.uuid;
      const checked =
        !!recordUuid && store.getState().selectedRecords.has(recordUuid);
      return h('div', { class: 'ap-gutter' }, [
        h('span', { class: 'ap-rownum' }, String(props.rowIndex + 1)),
        h('input', {
          class: 'ap-checkbox',
          type: 'checkbox',
          checked,
          onChange: (e: Event) =>
            recordUuid &&
            toggleRow(recordUuid, (e.target as HTMLInputElement).checked),
        }),
      ]);
    },
  };
}

export function useTableColumns({
  onOpenFieldMenu,
  canEdit,
}: {
  onOpenFieldMenu: (
    field: ClientField & { index: number },
    anchor: DOMRect,
  ) => void;
  canEdit: boolean;
}): { columns: ColumnRegular[]; columnTypes: Record<string, ColumnType> } {
  const store = useOptionalTableStore();

  const columnTypes = useMemo<Record<string, ColumnType>>(
    () => ({
      numeric: new NumberColumnType(),
      date: new DateColumnType(),
      select: new SelectColumnType(),
    }),
    [],
  );

  const fields = store?.getState().fields ?? [];
  // Subscribe so columns rebuild when fields change (rename/add/delete/options).
  const fieldsSignature = fields
    .map((field) =>
      field.type === FieldType.STATIC_DROPDOWN
        ? `${field.uuid}:${field.name}:${field.data.options
            .map((option) => option.value)
            .join(',')}`
        : `${field.uuid}:${field.name}:${field.type}`,
    )
    .join('|');

  const columns = useMemo<ColumnRegular[]>(() => {
    if (!store) {
      return [];
    }
    const dataColumns: ColumnRegular[] = fields.map((field, index) => {
      const columnTypeName = COLUMN_TYPE_BY_FIELD[field.type];
      const column: ColumnRegular = {
        prop: field.uuid,
        name: field.name,
        size: 207,
        minSize: 120,
        columnType: columnTypeName,
        readonly: (props) => !canEdit || !!props.model?.locked,
        cellProperties: buildDataCellProperties(field, index, store),
        columnTemplate: (h: HyperFunc<VNode>) =>
          h('div', { class: 'ap-th' }, [
            h('div', { class: 'ap-th-label' }, [
              typeIconVNode(h, field.type),
              h('span', { class: 'ap-th-name' }, field.name),
            ]),
            canEdit
              ? h(
                  'div',
                  {
                    class: 'ap-th-menu',
                    onClick: (e: MouseEvent) => {
                      e.stopPropagation();
                      const target = e.currentTarget as HTMLElement;
                      onOpenFieldMenu(
                        { ...field, index },
                        target.getBoundingClientRect(),
                      );
                    },
                  },
                  '⋯',
                )
              : null,
          ]),
      };
      if (field.type === FieldType.STATIC_DROPDOWN) {
        column.source = field.data.options.map((option) => option.value);
        // Render the value as a pill, but keep columnType:'select' so the
        // plugin still provides the dropdown editor.
        column.cellTemplate = (
          h: HyperFunc<VNode>,
          props: CellTemplateProp,
        ) => {
          const value = props.model?.[props.prop];
          if (value === undefined || value === null || value === '') {
            return h('span');
          }
          return h('span', { class: 'ap-pill' }, String(value));
        };
      }
      return column;
    });
    return dataColumns;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store, fieldsSignature, canEdit, columnTypes, onOpenFieldMenu]);

  return { columns, columnTypes };
}

export function mapRecordsToRows(
  records: ClientRecordData[],
  fields: ClientField[],
): Row[] {
  if (!records || records.length === 0) {
    return [];
  }
  return records.map((record) => {
    const row: Row = {
      id: record.uuid,
      recordId: record.recordId ?? null,
      agentRunId: record.agentRunId ?? null,
      locked: record.agentRunId != null,
    };
    record.values.forEach((cell) => {
      const field = fields[cell.fieldIndex];
      if (field) {
        row[field.uuid] = cell.value;
      }
    });
    return row;
  });
}
