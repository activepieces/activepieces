// Shapes of the Genaya REST API objects this piece reads, as documented in
// https://developer.genaya.com/openapi.yaml. Every field is optional because
// the API omits empty values.

export type GenayaAddress = {
  line1?: string;
  unit?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
};

export type GenayaClient = {
  id: string;
  numericId?: number | null;
  uuid?: string;
  title?: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  company?: string;
  phone?: string;
  secondaryPhone?: string;
  email?: string;
  phoneNumbers?: { number?: string; isPrimary?: boolean }[];
  address?: GenayaAddress;
  fullAddress?: string | null;
  leadSource?: string | null;
  status?: string;
  customFields?: Record<string, unknown>;
  organizationCompanyId?: string | null;
  organizationCompanyName?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type GenayaAppointment = {
  id: string;
  appointmentId?: number | null;
  uuid?: string | null;
  clientId?: string | null;
  clientFullName?: string;
  firstName?: string;
  lastName?: string;
  company?: string;
  phone?: string;
  secondaryPhone?: string;
  email?: string;
  appointmentType?: string;
  leadSource?: string | null;
  description?: string;
  address?: GenayaAddress;
  fullAddress?: string;
  serviceArea?: string | null;
  companyId?: string | null;
  companyName?: string | null;
  team?: { id?: string | null; name?: string | null }[];
  status?: string | null;
  subStatus?: string | null;
  tags?: string[];
  customFields?: Record<string, unknown>;
  startAt?: string | null;
  endAt?: string | null;
  startAtLocal?: string | null;
  endAtLocal?: string | null;
  timezone?: string;
  lineItems?: GenayaLineItem[];
  subtotal?: number;
  taxTotal?: number;
  total?: number;
  balance?: number;
  currency?: string;
  vendor?: string | null;
  createdByName?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type GenayaLineItem = {
  name?: string;
  description?: string;
  quantity?: number;
  unitPrice?: number;
  amount?: number;
  taxable?: boolean;
  taxRate?: number | string;
};

export type GenayaInvoice = {
  id: string;
  number?: number | null;
  uuid?: string | null;
  invoiceName?: string;
  status?: string;
  currency?: string;
  terms?: number;
  dueDate?: string;
  issueDate?: string;
  sent?: boolean;
  sentAt?: string | null;
  subtotal?: number;
  taxTotal?: number;
  total?: number;
  discountTotal?: number;
  discountName?: string | null;
  tipTotal?: number;
  amountPaid?: number;
  balance?: number;
  notes?: string;
  clientId?: string;
  clientDocId?: string;
  clientName?: string;
  firstName?: string;
  lastName?: string;
  companyName?: string;
  email?: string;
  phoneNumber?: string;
  address?: GenayaAddress;
  appointmentDocId?: string;
  organizationCompanyId?: string;
  billedFrom?: { companyName?: string };
  lineItems?: GenayaLineItem[];
  customFields?: Record<string, unknown>;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type GenayaTask = {
  id: string;
  environmentId?: string | null;
  groupId?: string | null;
  subGroupId?: string | null;
  title?: string;
  description?: string;
  priority?: string;
  assignees?: { id?: string; name?: string }[];
  tags?: string[];
  dueDate?: string | null;
  endDate?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type GenayaNamedRecord = {
  id: string;
  name?: string;
};

export type GenayaTeamMember = {
  id: string;
  name?: string;
  email?: string;
};

export type GenayaWebhookEndpoint = {
  id: string;
  secret?: string;
};

export type GenayaWebhookEvent = {
  id?: string;
  object?: string;
  type?: string;
  created?: string;
  organization_id?: string;
  data?: { object?: unknown };
};
