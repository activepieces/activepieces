import { Paging } from './common';

export interface Project {
  id: number;
  customers_id: number;
  name: string;
  number?: string;
  active: boolean;
  billable_default: boolean;
  note?: string;
  budget_money?: number;
  budget_is_hours: boolean;
  budget_is_not_strict: boolean;
  completed: boolean;
  billed_money?: number;
  billed_completely?: boolean;
  revenue_factor?: number;
}

export interface ProjectCreateRequest {
  name: string;
  customers_id: number;
  number?: string | null;
  active?: boolean;
  billable_default?: boolean;
  note?: string | null;
  budget_money?: number | null;
  budget_is_hours?: boolean;
  budget_is_not_strict?: boolean;
}

export interface ProjectUpdateRequest {
  name?: string;
  customers_id?: number;
  number?: string | null;
  active?: boolean;
  billable_default?: boolean;
  note?: string | null;
  budget_money?: number | null;
  budget_is_hours?: boolean;
  budget_is_not_strict?: boolean;
  hourly_rate?: number | null;
  completed?: boolean;
  billed_money?: number | null;
  billed_completely?: boolean;
}

export interface ProjectListFilter {
  active?: boolean;
  customers_id?: number;
}

export interface ProjectListResponse {
  paging: Paging;
  projects: Project[];
}

export interface ProjectSingleResponse {
  project: Project;
}
