export interface ListAPIV3Response<T> {
  records: T[];
  next?: string;
  prev?: string;
}

export interface ListAPIResponse<T> {
  list: T[];
  pageInfo: {
    totalRows: number;
    page: number;
    pageSize: number;
    isFirstPage: boolean;
    isLastPage: boolean;
  };
}

export interface WorkspaceResponse {
  id: string;
  title: string;
  description: string;
  deleted: boolean;
  deleted_at: string;
  status: number;
  order: number;
}

export interface BaseResponse {
  id: string;
  title: string;
  description: string;
  deleted: boolean;
  created_at: string;
  updated_at: string;
  status: number;
  order: number;
  type: string;
}

export interface TableResponse {
  id: string;
  source_id: string;
  description: string;
  base_id: string;
  table_name: string;
  title: string;
  type: string;
  created_at: string;
  updated_at: string;
  order: number;
  enabled: boolean;
}

type ColumnType =
  | 'Attachment'
  | 'AutoNumber'
  | 'Barcode'
  | 'Button'
  | 'Checkbox'
  | 'Collaborator'
  | 'Count'
  | 'CreatedTime'
  | 'Currency'
  | 'Date'
  | 'DateTime'
  | 'Decimal'
  | 'Duration'
  | 'Email'
  | 'Formula'
  | 'ForeignKey'
  | 'GeoData'
  | 'Geometry'
  | 'ID'
  | 'JSON'
  | 'LastModifiedTime'
  | 'LongText'
  | 'LinkToAnotherRecord'
  | 'Lookup'
  | 'MultiSelect'
  | 'Number'
  | 'Percent'
  | 'PhoneNumber'
  | 'Rating'
  | 'Rollup'
  | 'SingleLineText'
  | 'SingleSelect'
  | 'SpecificDBType'
  | 'Time'
  | 'URL'
  | 'Year'
  | 'QrCode'
  | 'Links'
  | 'User'
  | 'CreatedBy'
  | 'LastModifiedBy';

export interface ColumnResponse {
  id: string;
  title: string;
  column_name: string;
  uidt: ColumnType;
  colOptions?: {
    options: Array<{ title: string; id: string }>;
  };
  meta: Record<string, unknown> | null;
}

export interface ColumnV3Response {
  id: string;
  title: string;
  type: ColumnType;
  options: Record<string, unknown> | null;
}

export interface GetTableV3Response {
  id: string;
  title: string;
  fields: Array<ColumnV3Response>;
}
export interface GetTableResponse {
  id: string;
  source_id: string;
  table_name: string;
  title: string;
  type: string;
  created_at: string;
  updated_at: string;
  order: number;
  enabled: boolean;
  columns: Array<ColumnResponse>;
}

export interface ListRecordsParams
  extends Record<string, string | number | string[] | undefined> {
  fields?: string;
  sort?: string;
  where?: string;
  offset: number;
  limit: number;
  viewId?: string;
  filter?: string;
}

export interface DataOperationV3Response {
  records: { id?: string | number; fields: Record<string, unknown> }[];
}

export type DataOperationResponse =
  | Record<string, unknown>
  | DataOperationV3Response;

export interface CurrentUserResponse {
  id: string;
  email: string;
  email_verified: boolean;
  firstname: string | null;
  lastname: string | null;
  roles: Record<string, boolean>;
  base_roles?: Record<string, boolean>;
  workspace_roles?: Record<string, boolean>;
}

export interface NotificationResponse {
  id: string;
  type: string;
  body: Record<string, unknown>;
  is_read: boolean;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

export interface ViewSortResponse {
  id: string;
  fk_view_id: string;
  fk_column_id: string;
  direction: string;
}

export interface ViewColumnResponse {
  id: string;
  fk_view_id: string;
  fk_column_id: string;
  show: boolean;
  order: number;
}

export interface ViewResponse {
  id: string;
  title: string;
  type: number;
  fk_model_id: string;
  base_id: string;
  uuid: string | null;
  show: boolean;
}

export interface SharedViewGroupedDataItem {
  key: string;
  value: Record<string, unknown>[];
}

export interface AttachmentUploadReq {
  url: string;
  title?: string;
  mimetype?: string;
}
