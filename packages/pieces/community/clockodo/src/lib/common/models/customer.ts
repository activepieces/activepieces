export type Customer = {
  id: number;
  name: string;
  number?: string | null;
  active: boolean;
  billable_default: boolean;
  note?: string | null;
  color: number;
};

export type CustomerCreateRequest = {
  name: string;
  number?: string | null;
  active?: boolean;
  billable_default?: boolean;
  note?: string | null;
  color?: number;
};

export type CustomerUpdateRequest = Partial<CustomerCreateRequest>;

export type CustomerListFilter = {
  active?: boolean;
};
