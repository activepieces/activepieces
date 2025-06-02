export interface PandaDocDocument {
  id: string;
  name: string;
  status: string;
  date_created: string;
  date_modified: string;
}

export interface PandaDocDocumentResponse {
  results: PandaDocDocument[];
  count: number;
}

export interface PandaDocTemplate {
  id: string;
  name: string;
  date_created: string;
  date_modified: string;
  version: string;
  status: string;
}

export interface PandaDocTemplateResponse {
  results: PandaDocTemplate[];
  count: number;
} 