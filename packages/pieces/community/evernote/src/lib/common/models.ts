export interface EvernoteNote {
  guid: string;
  title: string;
  content: string;
  notebookGuid: string;
  tagGuids: string[];
  created: number;
  updated: number;
}

export interface EvernoteNotebook {
  guid: string;
  name: string;
  stack?: string;
  serviceCreated?: number;
}

export interface EvernoteTag {
  guid: string;
  name: string;
  parentGuid?: string;
}

export interface EvernoteSearchResult {
  notes: EvernoteNote[];
  totalNotes: number;
}

export interface EvernoteApiResponse<T> {
  data: T;
  error?: string;
}
