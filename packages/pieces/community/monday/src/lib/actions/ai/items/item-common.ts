import { isNil } from '@activepieces/pieces-framework';

function mapItemSummary(item: MondayItemSummary) {
  return {
    id: item.id,
    name: item.name,
    state: item.state ?? null,
    url: item.url ?? null,
    board_id: item.board?.id ?? null,
    group_id: item.group?.id ?? null,
  };
}

function mapItemWithValues(item: MondayItemWithValues) {
  return {
    ...mapItemSummary(item),
    group_title: item.group?.title ?? null,
    created_at: item.created_at ?? null,
    updated_at: item.updated_at ?? null,
    column_values: item.column_values.map((cv) => ({
      column_id: cv.id,
      type: cv.type,
      text: cv.text ?? null,
      value: cv.value ?? null,
    })),
  };
}

function columnIdsVariable(columnIds: unknown): string[] | null {
  if (!Array.isArray(columnIds)) {
    return null;
  }
  const ids = columnIds.filter((id) => !isNil(id) && String(id).trim() !== '').map((id) => String(id).trim());
  return ids.length > 0 ? ids : null;
}

function clampLimit(limit: number | undefined): number {
  if (isNil(limit) || Number.isNaN(limit)) {
    return 50;
  }
  return Math.min(Math.max(Math.trunc(limit), 1), 500);
}

function readString({ row, key }: { row: unknown; key: string }): string | null {
  if (typeof row !== 'object' || row === null || !(key in row)) {
    return null;
  }
  const value: unknown = Reflect.get(row, key);
  if (isNil(value) || String(value).trim() === '') {
    return null;
  }
  return String(value).trim();
}

export const itemCommon = {
  mapItemSummary,
  mapItemWithValues,
  columnIdsVariable,
  clampLimit,
  readString,
};

export const ITEM_SUMMARY_FIELDS = 'id name state url board { id } group { id }';

export const ITEM_WITH_VALUES_FIELDS = `id name state url created_at updated_at board { id } group { id title } column_values(ids: $columnIds) { id type text value }`;

export type MondayItemSummary = {
  id: string;
  name: string;
  state?: string | null;
  url?: string | null;
  board?: { id: string } | null;
  group?: { id: string; title?: string } | null;
};

export type MondayItemWithValues = MondayItemSummary & {
  created_at?: string | null;
  updated_at?: string | null;
  column_values: { id: string; type: string; text: string | null; value: string | null }[];
};
