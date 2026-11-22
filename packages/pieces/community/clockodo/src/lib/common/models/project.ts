export type Project = {
  id: number;
  customers_id: number;
  name: string;
  number?: string | null;
  active: boolean;
  billable_default: boolean;
  note?: string | null;
  budget?: ProjectBudget | null;
  completed: boolean;
  billed_money?: number | null;
  billed_completely?: boolean | null;
  revenue_factor?: number | null;
};

export type ProjectCreateRequest = {
  name: string;
  customers_id: number;
  number?: string | null;
  active?: boolean;
  billable_default?: boolean;
  note?: string | null;
  budget?: ProjectBudget;
};

export type ProjectUpdateRequest = Partial<ProjectCreateRequest>;

export type ProjectBillingRequest = {
  billed: boolean;
};

export type ProjectBudget = {
  amount: number;
  monetary: boolean;
  hard: boolean;
  from_subprojects: boolean;
};

export type ProjectBudgetInput = {
  amount?: number | null;
  is_hours?: boolean | null;
  is_not_strict?: boolean | null;
};

export type ProjectListFilter = {
  active?: boolean;
  customers_id?: number;
};
