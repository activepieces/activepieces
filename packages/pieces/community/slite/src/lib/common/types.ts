export type SliteOwner = {
  userId?: string;
  groupId?: string;
};

export type SliteNote = {
  id: string;
  title: string;
  url: string;
  parentNoteId: string | null;
  createdAt: string;
  updatedAt: string;
  lastEditedAt: string;
  archivedAt: string | null;
  iconShape: string | null;
  iconColor: string | null;
  owner: SliteOwner;
  columns?: string[];
  attributes?: string[];
  reviewState?: string;
  content?: string;
};

export type SliteChildrenResponse = {
  notes: SliteNote[];
  total: number;
  hasNextPage: boolean;
  nextCursor: string | null;
};

export type SliteParentNote = {
  id?: string;
  title?: string;
};

export type SliteSearchHit = {
  id: string;
  title: string;
  type: string;
  highlight: string;
  parentNotes: SliteParentNote[];
  lastEditedAt: string;
  updatedAt: string;
  archivedAt: string | null;
  iconColor: string | null;
  iconShape: string | null;
  reviewState?: string;
};

export type SliteSearchResponse = {
  hits: SliteSearchHit[];
  page: number;
  nbPages: number;
};

export type SliteAskSource = {
  id: string;
  title: string;
  url: string;
  updatedAt: string;
  explanation?: string;
};

export type SliteAskResponse = {
  answer: string;
  sources: SliteAskSource[];
};

export type SliteIndexResponse = {
  id: string;
  title: string;
  url: string;
  updatedAt: string;
  explanation?: string;
};

export type SliteTileUpdateResponse = {
  url: string;
};
