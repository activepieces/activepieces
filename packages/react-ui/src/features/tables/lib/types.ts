export type Row = {
  id: string;
  [key: string]: any;
};

export enum RowHeight {
  COMPACT = 'compact',
  DEFAULT = 'default',
  EXPANDED = 'expanded',
}

export const ROW_HEIGHT_MAP: Record<RowHeight, number> = {
  [RowHeight.COMPACT]: 28,
  [RowHeight.DEFAULT]: 42,
  [RowHeight.EXPANDED]: 52,
};
