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
  status: 'published' | 'notPublished';
};
