// Common types for Bexio API

export interface BexioContact {
  id: number;
  nr: string;
  contact_type_id: number;
  name_1: string;
  name_2?: string;
  salutation_id?: number;
  salutation_form?: number;
  title_id?: number;
  birthday?: string;
  address?: string;
  postcode?: string;
  city?: string;
  country_id?: number;
  mail?: string;
  mail_second?: string;
  phone_fixed?: string;
  phone_fixed_second?: string;
  phone_mobile?: string;
  fax?: string;
  url?: string;
  skype_name?: string;
  remarks?: string;
  language_id?: number;
  contact_group_ids?: string;
  contact_branch_ids?: string;
  user_id?: number;
  owner_id?: number;
}

export interface BexioCompany {
  id: number;
  name: string;
  address?: string;
  address_nr?: string;
  postcode?: string;
  city?: string;
  country_id?: number;
  legal_form?: string;
}

export interface BexioAccount {
  id: number;
  account_no: string;
  name: string;
  account_type: number;
}

export interface BexioTax {
  id: number;
  name: string;
  percentage: string;
}

export interface BexioCurrency {
  id: number;
  name: string;
}

export interface BexioManualEntry {
  debit_account_id?: number;
  credit_account_id?: number;
  tax_id?: number;
  tax_account_id?: number;
  description?: string;
  amount?: number;
  currency_id?: number;
  currency_factor?: number;
}

export interface BexioManualEntryResponse {
  id: number;
  type: 'manual_single_entry' | 'manual_compound_entry' | 'manual_group_entry';
  date: string;
  reference_nr?: string;
  created_by_user_id?: number;
  edited_by_user_id?: number;
  entries: BexioManualEntry[];
  is_locked?: boolean;
  locked_info?: string;
}

export interface BexioError {
  error_code: number;
  message: string;
}

export interface BexioListResponse<T> {
  data: T[];
  paging?: {
    page: number;
    page_size: number;
    page_count: number;
    item_count: number;
  };
}

