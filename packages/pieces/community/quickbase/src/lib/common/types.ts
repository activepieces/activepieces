export interface QuickbaseApp {
  id: string;
  name: string;
  description?: string;
  created: string;
  updated: string;
}

export interface QuickbaseTable {
  id: string;
  name: string;
  alias?: string;
  description?: string;
  created: string;
  updated: string;
  nextRecordId: number;
  nextFieldId: number;
  defaultSortFieldId: number;
  defaultSortOrder: string;
  keyFieldId: number;
  singleRecordName: string;
  pluralRecordName: string;
}

export interface QuickbaseField {
  id: number;
  label: string;
  fieldType: string;
  mode?: string;
  required?: boolean;
  unique?: boolean;
  properties?: Record<string, any>;
}

export interface QuickbaseRecord {
  [fieldId: string]: {
    value: any;
  };
}

export interface QuickbaseRecordResponse {
  data: QuickbaseRecord[];
  fields: QuickbaseField[];
  metadata: {
    numRecords: number;
    numFields: number;
    skip: number;
    top: number;
    totalRecords: number;
  };
}

export interface QuickbaseCreateRecordResponse {
  data: Array<{
    [fieldId: string]: {
      value: any;
    };
  }>;
  metadata: {
    createdRecordIds: number[];
    totalNumberOfRecordsProcessed: number;
    unchangedRecordIds: number[];
    updatedRecordIds: number[];
  };
}

export interface QuickbaseUpdateRecordResponse {
  data: Array<{
    [fieldId: string]: {
      value: any;
    };
  }>;
  metadata: {
    totalNumberOfRecordsProcessed: number;
    unchangedRecordIds: number[];
    updatedRecordIds: number[];
  };
}

export interface QuickbaseDeleteRecordResponse {
  numberDeleted: number;
}

export interface QuickbaseError {
  message: string;
  description?: string;
  code?: string;
}

export interface QuickbaseApiError {
  errors: QuickbaseError[];
}

export interface QuickbaseQuery {
  from: string;
  select?: number[];
  where?: string;
  sortBy?: Array<{
    fieldId: number;
    order: 'ASC' | 'DESC';
  }>;
  groupBy?: Array<{
    fieldId: number;
    grouping: string;
  }>;
  options?: {
    skip?: number;
    top?: number;
    compareWithAppLocalTime?: boolean;
  };
}