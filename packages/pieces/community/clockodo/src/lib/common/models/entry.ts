import { Paging, ListRequest } from './common';

export enum EntryType {
  TIME_RECORD = 1,
  LUMP_SUM = 2,
  LUMP_SERVICE = 3,
}

export enum BillableType {
  NOT_BILLABLE = 0,
  BILLABLE = 1,
  BILLED = 2,
}

export interface Entry {
  id: number;
  type: EntryType;
  customers_id: number;
  projects_id?: number;
  users_id: number;
  billable: BillableType;
  texts_id?: string;
  time_since: string;
  time_until?: string;
  time_insert: string;
  time_last_change: string;
  customers_name?: string;
  projects_name?: string;
  users_name?: string;
  text?: string;
  revenue?: number;
}

export interface TimeRecordEntry extends Entry {
  services_id: number;
  duration?: number;
  offset: number;
  clocked: boolean;
  clocked_offline: boolean;
  time_clocked_since?: string;
  time_last_change_worktime: string;
  hourly_rate: number;
  service_name?: string;
}

export interface LumpSumEntry extends Entry {
  services_id: number;
  lumpsum: number;
  service_name?: string;
}

export interface LumpServiceEntry extends Entry {
  lumpsum_services_id: number;
  lumpsums_amount: number;
  lumpsum_services_price?: number;
}

export interface EntryCreateRequest {
  customers_id: number;
}

export interface TimeRecordEntryCreateRequest extends EntryCreateRequest {
  services_id: number;
  billable: BillableType;
  time_since: string;
  time_until: string | null;
  users_id?: number;
  duration?: number;
  hourly_rate?: number;
  projects_id?: number;
  text?: string;
}

export interface LumpSumEntryCreateRequest extends EntryCreateRequest {
  services_id: number;
  lumpsum: number;
  billable: BillableType;
  time_since: string;
  users_id?: number;
  projects_id?: number;
  text?: string;
}

export interface LumpServiceEntryCreateRequest extends EntryCreateRequest {
  lumpsum_services_id: number;
  lumpsum_services_amount: number;
  billable: BillableType;
  time_since: string;
  users_id?: number;
  projects_id?: number;
  text?: string;
}

export interface EntryUpdateRequest {
  customers_id?: number;
  projects_id?: number;
  services_id?: number;
  lumpsum_services_id?: number;
  users_id?: number;
  billable?: BillableType;
  text?: string;
  duration?: number;
  lumpsum?: number;
  lumpsum_services_amount?: number;
  hourly_rate?: number;
  time_since?: string;
  time_until?: string;
}

export interface EntryListFilter {
  users_id?: number;
  customers_id?: number;
  projects_id?: number;
  services_id?: number;
  lumpsum_services_id?: number;
  billable?: BillableType;
  text?: string;
  texts_id?: number;
  budget_type?: string;
}

export interface EntryListRequest extends ListRequest<EntryListFilter> {
  time_since: string;
  time_until: string;
  enhanced_list?: boolean;
  calc_also_revenues_for_projects_with_hard_budget?: boolean;
}

export interface EntryListResponse {
  paging: Paging;
  entries: Entry[];
}

export interface EntrySingleResponse {
  entry: Entry;
}
