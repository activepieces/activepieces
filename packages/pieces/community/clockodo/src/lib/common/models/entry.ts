export enum BillableType {
  NOT_BILLABLE = 0,
  BILLABLE = 1,
  BILLED = 2,
}

export type Entry = {
  id: number;
  type: number;
  customers_id: number;
  projects_id?: number | null;
  services_id?: number | null;
  users_id: number;
  billable: number;
  texts_id?: number | null;
  text?: string | null;
  time_since: string;
  time_until?: string | null;
  time_insert: string;
  time_last_change: string;
  duration?: number | null;
  hourly_rate?: number | null;
  customers_name?: string;
  projects_name?: string | null;
  services_name?: string;
  users_name?: string;
  revenue?: number | null;
};

export type TimeRecordEntryCreateRequest = {
  customers_id: number;
  services_id: number;
  time_since: string;
  time_until: string;
  billable?: BillableType;
  users_id?: number;
  hourly_rate?: number;
  projects_id?: number;
  text?: string;
};

export type EntryUpdateRequest = {
  customers_id?: number;
  projects_id?: number;
  services_id?: number;
  users_id?: number;
  text?: string;
  time_since?: string;
  time_until?: string;
};

export type EntryListFilter = {
  users_id?: number;
  customers_id?: number;
  projects_id?: number;
  services_id?: number;
  billable?: BillableType;
};

export type EntryListRequest = {
  time_since: string;
  time_until: string;
  page?: number;
  enhanced_list?: boolean;
  filter?: EntryListFilter;
};
