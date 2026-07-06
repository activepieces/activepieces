export type GlideTable = {
  id: string;
  name: string;
};

export interface GlideRow {
  [key: string]: GlideRowValue;
}

export type GlideRowValue =
  | string
  | number
  | boolean
  | null
  | GlideRow
  | GlideRowValue[];

export type GlideListTablesResponse = {
  data: GlideTable[];
};

export type GlideGetRowsResponse = {
  data: GlideRow[];
  continuation?: string;
};

export type GlideAddRowsResponse = {
  data: {
    rowIDs: string[];
  };
};
