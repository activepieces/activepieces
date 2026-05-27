function flattenCustomer(customer: GorgiasCustomer) {
  return {
    id: customer.id,
    name: customer.name ?? null,
    firstname: customer.firstname ?? null,
    lastname: customer.lastname ?? null,
    email: customer.email ?? null,
    external_id: customer.external_id ?? null,
    language: customer.language ?? null,
    timezone: customer.timezone ?? null,
    created_datetime: customer.created_datetime ?? null,
    updated_datetime: customer.updated_datetime ?? null,
  };
}

export const gorgiasCustomer = { flattenCustomer };

export type GorgiasCustomer = {
  id: number;
  name: string | null;
  firstname: string | null;
  lastname: string | null;
  email: string | null;
  external_id: string | null;
  language: string | null;
  timezone: string | null;
  created_datetime: string;
  updated_datetime: string;
};
