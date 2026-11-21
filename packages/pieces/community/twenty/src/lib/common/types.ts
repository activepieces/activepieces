import type { AppConnectionType } from '@activepieces/pieces-framework';

export type TwentyAuthValue = {
  type: AppConnectionType.CUSTOM_AUTH;
  props: { base_url: string; api_key: string };
};

export type TwentyRecord = {
  id?: string;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string;
  [key: string]: unknown;
};

export type TwentyPersonName = { firstName?: string; lastName?: string };

export type TwentyPerson = TwentyRecord & { name?: TwentyPersonName };

export type TwentyResponse = { data?: Record<string, unknown> };

export type TwentyPersonResponse = { data?: { person?: TwentyPerson } };

export type TwentyPageInfo = {
  hasNextPage?: boolean;
  hasPreviousPage?: boolean;
  startCursor?: string | null;
  endCursor?: string | null;
};

export type TwentyEnvelope<T> = { data: Record<string, T> };

export type TwentyRecordPage = TwentyEnvelope<TwentyRecord[]> & {
  pageInfo?: TwentyPageInfo;
  totalCount?: number;
};

export type TwentyRecordList = {
  records: TwentyRecord[];
  pageInfo?: TwentyPageInfo;
  totalCount?: number;
};

export type TwentyDuplicateConnection = {
  totalCount?: number;
  pageInfo?: TwentyPageInfo;
  [key: string]: TwentyRecord[] | TwentyPageInfo | number | undefined;
};

export type TwentyMetadataItem = {
  id: string;
  [key: string]: unknown;
};

export type TwentyMetadataPage = {
  data: TwentyMetadataItem[] | Record<string, TwentyMetadataItem[]>;
  pageInfo?: TwentyPageInfo;
  totalCount?: number;
};

export type TwentyMetadataField = {
  id: string;
  name: string;
  type: string;
  settings?: Record<string, unknown>;
  options?: Record<string, unknown>[];
  [key: string]: unknown;
};

export type TwentyMetadataSingle = TwentyMetadataItem & {
  data?: { object?: TwentyMetadataItem };
};

export type SelectOption = { label: string; value: string };

export type TwentyFieldRef = {
  id: string;
  key: string;
};

export type TwentyObjectRef = {
  id: string;
  namePlural: string;
  nameSingular: string;
};

export type FieldPurpose = 'filter' | 'write';

export type QueryOperator =
  | 'eq'
  | 'neq'
  | 'in'
  | 'is'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'startsWith'
  | 'like'
  | 'ilike'
  | 'containsAny';

export type FieldValue = string | number | boolean | string[];

export type FieldEntry = {
  field: string;
  value: FieldValue | undefined;
};

export type QueryCondition = FieldEntry & { operator: QueryOperator };

export type QueryConjunction = 'and' | 'or' | 'not';

export type QueryConditionGroup = {
  conjunction: QueryConjunction;
  conditions: QueryConditionNode[];
};

export type QueryConditionNode = QueryCondition | QueryConditionGroup;

export type TwentyTimelineDiff = Record<
  string,
  { before: unknown; after: unknown }
>;
export type TwentyTimelineActivity = {
  id: string;
  recordId: string;
  diff: TwentyTimelineDiff;
  workspaceMemberId: string | null;
  updatedAt: string;
  createdAt: string;
};

export type TwentyDiffCache = Record<
  string,
  { values: Record<string, unknown>; createdAt: number }
>;
