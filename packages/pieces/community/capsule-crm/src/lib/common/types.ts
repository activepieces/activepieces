// Based on Capsule CRM API v2 documentation

// Core API Objects
export interface Party {
    id: number;
    type: 'person' | 'organisation';
    firstName?: string;
    lastName?: string;
    name?: string;
    displayName: string; // The full name or organisation name as returned by the API
    [key: string]: any;
}

export interface Opportunity {
    id: number;
    name: string;
    [key: string]: any;
}

export interface Project {
    id: number;
    name: string;
    [key: string]: any;
}

export interface Kase { // Alias for Project, as the API uses 'kases' for projects
    id: number;
    name: string;
    [key: string]: any;
}

export interface Task {
    id: number;
    description: string;
    [key: string]: any;
}

export interface Note {
    id: number;
    content: string;
    [key: string]: any;
}

export interface Tag {
    id: number;
    name: string;
}

export interface Milestone {
    id: number;
    name: string;
}

export interface ProjectStage {
    id: number;
    name: string;
}

export interface TaskCategory {
    id: number;
    name: string;
}

export interface Webhook {
    id: number;
    [key: string]: any;
}

// Param Interfaces for Client Methods
export interface CreatePartyParams {
    type?: 'person' | 'organisation';
    firstName?: string;
    lastName?: string;
    name?: string;
    emailAddresses?: { type: string; address: string; }[];
    phoneNumbers?: { number: string; }[];
    about?: string;
    jobTitle?: string;
    organisationId?: number;
    websites?: { service: string; address: string; }[];
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

export interface CreateOpportunityParams {
    partyId: number;
    milestoneId: number;
    name: string;
    description?: string;
    expectedCloseOn?: string;
    currency?: string;
    amount?: number;
}

export interface UpdateOpportunityParams {
    name?: string;
    description?: string;
    milestoneId?: number;
    expectedCloseOn?: string;
    currency?: string;
    amount?: number;
}

export interface CreateProjectParams {
    partyId: number;
    name: string;
    description?: string;
    opportunityId?: number;
    stageId?: number;
    status?: 'OPEN' | 'CLOSED';
    expectedCloseOn?: string;
}

export interface CreateTaskParams {
    description: string;
    detail?: string;
    partyId?: number;
    opportunityId?: number;
    kaseId?: number;
    categoryId?: number;
    dueOn?: string;
    dueTime?: string;
}

export interface CreateNoteParams {
    content: string;
    partyId?: number;
    opportunityId?: number;
    kaseId?: number;
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
