import { Paging } from './common';

export interface Customer {
  id: number;
  name: string;
  number?: string;
  active: boolean;
  billable_default: boolean;
  note?: string;
  color: number;
}

export interface CustomerCreateRequest {
  name: string;
  number?: string | null;
  active?: boolean;
  billable_default?: boolean;
  note?: string | null;
  color?: number;
}

export interface CustomerUpdateRequest {
  name?: string;
  number?: string | null;
  active?: boolean;
  billable_default?: boolean;
  note?: string | null;
  color?: number;
}

export interface CustomerListFilter {
  active?: boolean;
}

export interface CustomerListResponse {
  paging: Paging;
  customers: Customer[];
}

export interface CustomerSingleResponse {
  customer: Customer;
}
