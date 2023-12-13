export type ContactCreateRequest = {
  first: string;
  last: string;
  email?: string;
  phone?: string;
  notes?: string;
  clientName?: string;
  defaultContact?: boolean;
  portalAccess?: boolean;
  invoiceContact?: boolean;
};

export type ClientListResponse = {
  id: string;
  name: string;
};

export type ProjectSearchResponse = {
  id: string;
  name: string;
};

export type ProjectTaskStageListResponse = {
  id: string;
  label: string;
  hexColor: string;
  complete: boolean;
  clientApproval: boolean;
};

export type ProjectCreateRequest = {
  name: string;
  clientName: string;
  startDate?: string;
  dueDate?: string;
  portalAccess: string;
  showTimeWorkedInPortal?: boolean;
  feeSchedule: {
    feeType: string;
    amount?: number;
    estimateMax?: number;
    estimateMin?: number;
    taxable?: boolean;
  };
};

export type ClientCreateRequest = {
  name: string;
  clientType: string;
  initials?: string;
  address1?: string;
  address2?: string;
  city?: string;
  locality?: string;
  postal?: string;
  country?: string;
  website?: string;
  phone?: string;
  color?: string;
  taxId?: string;
  leadSource?: string;
  archive: boolean;
  payInstructions?: string;
  hourlyAmount?: number;
  roundingIncrement?: number;
  currency?: string;
  stripeClientId?: string;
  notes?: string;
};

export type TaskCreateRequest = {
  name: string;
  clientName: string;
  projectName: string;
  status: string;
  description?: string;
  dueDate?: string;
  startDate?: string;
  priority?: number;
  tasks?: string[];
  assignedTo?: string[];
  customValues?: Record<string, string>;
};
