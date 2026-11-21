export type AlgoliaAuthValue = {
  props: {
    applicationId: string;
    apiKey: string;
  };
};

export type AlgoliaRecord = {
  [key: string]: AlgoliaJsonValue;
};

export type AlgoliaJsonValue =
  | string
  | number
  | boolean
  | null
  | AlgoliaRecord
  | AlgoliaJsonValue[];

export type AlgoliaIndex = {
  name: string;
  entries?: number;
  dataSize?: number;
  updatedAt?: string;
  primary?: string;
  replicas?: string[];
};

export type AlgoliaIndexListResponse = {
  items: AlgoliaIndex[];
  nbPages: number;
};

export type AlgoliaBrowseResponse = {
  hits: AlgoliaRecord[];
  cursor?: string;
};

export type AlgoliaBatchResponse = {
  taskID: number;
  objectIDs?: string[];
};

export type AlgoliaTaskStatusResponse = {
  status: AlgoliaTaskStatus;
};

export type AlgoliaTaskStatus = 'published' | 'notPublished';

export type AlgoliaTaskOutcome = {
  status: AlgoliaTaskStatus;
  note?: string;
};

export type AlgoliaWriteResult = AlgoliaTaskOutcome & {
  taskID: number;
  objectIDs: string[];
};

export type AlgoliaSearchResponse = {
  hits: AlgoliaRecord[];
  nbHits: number;
  page: number;
  nbPages: number;
  hitsPerPage: number;
  query: string;
};

export type AlgoliaPartialUpdateResponse = {
  taskID: number;
  objectID: string;
  updatedAt: string;
};

export type AlgoliaDeleteByQueryResponse = {
  taskID: number;
  updatedAt?: string;
};
