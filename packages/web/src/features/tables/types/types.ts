export type Row = {
  id: string;
  recordId: string | null;
  agentRunId: string | null;
  locked: boolean;
  [key: string]: any;
};

export enum RowHeight {
  COMPACT = 'compact',
  DEFAULT = 'default',
  EXPANDED = 'expanded',
}

export const ROW_HEIGHT_MAP: Record<RowHeight, number> = {
  [RowHeight.COMPACT]: 32,
  [RowHeight.DEFAULT]: 42,
  [RowHeight.EXPANDED]: 52,
};

export const HEADER_ROW_HEIGHT_MAP: Record<RowHeight, number> = {
  [RowHeight.COMPACT]: 38,
  [RowHeight.DEFAULT]: 42,
  [RowHeight.EXPANDED]: 52,
};
