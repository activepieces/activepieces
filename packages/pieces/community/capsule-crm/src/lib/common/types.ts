export interface Party {
  id: number;
  type: 'person' | 'organisation';
  firstName?: string;
  lastName?: string;
  name?: string;
  addresses?: {
    id: number;
    street: string;
    city: string;
  }[];
  websites?: {
    id: number;
    address: string;
  }[];
  emailAddresses?: {
    id: number;
    address: string;
  }[];
  phoneNumbers?: {
    id: number;
    number: string;
  }[];
}

export interface CreatePartyParams {
  type: 'person' | 'organisation';
  firstName?: string;
  lastName?: string;
  name?: string;
  emailAddresses?: {
    type?: string;
    address: string;
  }[];
  phoneNumbers?: {
    type?: string;
    number: string;
  }[];
  title?: string;
  jobTitle?: string;
  about?: string;
  organisationId?: number;
  ownerId?: number;
  teamId?: number;
  tags?: string[];
  fields?: { definition: { id: number }; value: unknown }[];
  addresses?: {
    type?: string;
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    zip?: string;
  }[];
  websites?: {
    type?: string;
    service: string;
    address: string;
  }[];
}

export interface UpdatePartyParams {
  firstName?: string;
  lastName?: string;
  name?: string;
  title?: string;
  about?: string;
  ownerId?: number;
  teamId?: number;
  addresses?: {
    id?: number;
    type?: string;
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    zip?: string;
    _delete?: boolean;
  }[];
  websites?: {
    id?: number;
    type?: string;
    service?: string;
    address?: string;
    _delete?: boolean;
  }[];
  emailAddresses?: {
    id?: number;
    type?: string;
    address?: string;
    _delete?: boolean;
  }[];
  phoneNumbers?: {
    id?: number;
    type?: string;
    number?: string;
    _delete?: boolean;
  }[];
}

export interface Milestone {
  id: number;
  name: string;
  description?: string;
  probability: number;
  complete: boolean;
  daysUntilStale: number;
}

export interface OpportunityValue {
  amount: number;
  currency: string;
}

export interface OpportunityCustomField {
  id?: number;
  definition: {
    id: number;
  };
  value: unknown;
  _delete?: boolean;
}

export interface OpportunityTag {
  id?: number;
  name: string;
  _delete?: boolean;
}

export interface Opportunity extends CreateOpportunityParams {
  id: number;
  createdAt: string;
  updatedAt: string;
  tags?: OpportunityTag[];
  fields?: OpportunityCustomField[];
}

export interface Stage {
  id: number;
  name: string;
}

export interface CreateProjectParams {
  party: { id: number };
  name: string;
  description?: string;
  owner?: { id: number };
  team?: { id: number };
  status?: 'OPEN' | 'CLOSED';
  opportunity?: { id: number };
  stage?: { id: number };
  expectedCloseOn?: string;
  tags?: OpportunityTag[];
  fields?: OpportunityCustomField[];
}

export interface Project extends CreateProjectParams {
  id: number;
  createdAt: string;
  updatedAt: string;
  closedOn?: string;
}

export interface CreateOpportunityParams {
  name: string;
  party: {
    id: number;
  };
  milestone: {
    id: number;
  };
  description?: string;
  owner?: { id: number };
  team?: { id: number };
  value?: OpportunityValue;
  expectedCloseOn?: string;
  probability?: number;
  durationBasis?: string;
  duration?: number;
  tags?: OpportunityTag[];
  fields?: OpportunityCustomField[];
}

export interface UpdateOpportunityParams {
  name?: string;
  description?: string;
  owner?: { id: number };
  team?: { id: number };
  milestone?: { id: number };
  value?: OpportunityValue;
  expectedCloseOn?: string;
  probability?: number;
  durationBasis?: string;
  duration?: number;
  tags?: OpportunityTag[];
  fields?: OpportunityCustomField[];
}

export interface Project {
  id: number;
  name: string;
}

export interface Case {
  id: number;
  name: string;
}

export interface User {
  id: number;
  username: string;
  name: string;
}

export interface Team {
  id: number;
  name: string;
}

export interface Tag {
  id: number;
  name: string;
  dataTag: boolean;
}

export interface CustomField {
  id: number;
  name: string;
  type: string;
  options?: string[];
}

export interface Task {
  id: number;
  type: 'Task';
  description: string;
}

export interface CreateTaskParams {
  description: string;
  dueOn: string;
  detail?: string;
  category?: { id: number };
  owner?: { id: number };
  party?: { id: number };
  opportunity?: { id: number };
  kase?: { id: number };
  dueTime?: string;
}

export interface Task extends CreateTaskParams {
  id: number;
  createdAt: string;
  updatedAt: string;
  status: 'OPEN' | 'COMPLETED' | 'PENDING';
}

export interface ActivityType {
  id: number;
  name: string;
}

export interface CreateEntryParams {
  type: 'note';
  content: string;
  activityType?: { id: number };
  party?: { id: number };
  opportunity?: { id: number };
  kase?: { id: number };
}

export interface Entry extends CreateEntryParams {
  id: number;
  createdAt: string;
  updatedAt: string;
}

export interface Note {
  id: number;
  type: 'Note';
  content: string;
}

export interface CreateNoteParams {
  content: string;
  partyId?: number;
  opportunityId?: number;
  caseId?: number;
  projectId?: number;
}

export interface FindContactParams {
  email?: string;
  searchTerm?: string;
}

export interface FindProjectParams {
  searchTerm: string;
}

export interface FindOpportunityParams {
  searchTerm: string;
}

export interface Webhook {
  id: number;
  url: string;
  event: string;
}

export interface Category {
  id: number;
  name: string;
  colour: string;
}

export interface FilterCondition {
  field: string;
  operator: string;
  value: string | number | boolean;
}

export interface Filter {
  conditions: FilterCondition[];
}

export interface RestHook {
  id: number;
  event: string;
  targetUrl: string;
}

export interface CreateRestHookParams {
  event: string;
  targetUrl: string;
  description: string;
}