export interface AttioRecord {
  id: string;
  [key: string]: any;
}

export interface AttioListEntry {
  id: string;
  record_id: string;
  list_id: string;
  [key: string]: any;
}

export interface AttioList {
  id: string;
  name: string;
}

export interface AttioAttribute {
  id: string;
  name: string;
  type: string;
}
