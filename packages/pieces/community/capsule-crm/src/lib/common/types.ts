export interface Party {
  id: number;
  type: 'person' | 'organisation';
  firstName?: string;
  lastName?: string;
  name?: string; 
}

export interface CreatePartyParams {
  type: 'person' | 'organisation';
  firstName?: string;
  lastName?: string;
  name?: string;
  email?: string;
  phone?: string;
}

export interface UpdatePartyParams {
  firstName?: string;
  lastName?: string;
  name?: string; 
  title?: string;
  about?: string;
  email?: string;
  phone?: string;
}

export interface Milestone {
  id: number;
  name: string;
}

export interface Opportunity {
  id: number;
  name: string;
}

export interface CreateOpportunityParams {
  partyId: number;
  milestoneId: number;
  name: string;
  description?: string;
  currency?: string;
  amount?: number;
  expectedCloseOn?: string;
}

export interface UpdateOpportunityParams {
  name?: string;
  description?: string;
  milestoneId?: number;
  currency?: string;
  amount?: number;
  expectedCloseOn?: string;
}

export interface Project {
  id: number;
  name: string;
}

export interface CreateProjectParams {
  partyId: number;
  name: string;
  description?: string;
  opportunityId?: number;
}

export interface Case {
  id: number;
  name: string;
}

export interface User {
  id: number;
  username: string;
}

export interface Task {
  id: number;
  type: 'Task';
  description: string;
}

export interface CreateTaskParams {
  description: string;
  partyId?: number;
  opportunityId?: number;
  caseId?: number;
  projectId?: number;
  dueOn?: string;
  ownerId?: number;
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