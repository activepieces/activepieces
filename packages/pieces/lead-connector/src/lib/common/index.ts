import { httpClient, HttpMethod, AuthenticationType } from "@activepieces/pieces-common";

export const baseUrl = 'https://rest.leadconnectorhq.com/v1';

export async function getCampaigns(auth: string): Promise<any> {
    const result = await httpClient.sendRequest({
        url: `${baseUrl}/campaigns`,
        method: HttpMethod.GET,
        authentication: {
            type: AuthenticationType.BEARER_TOKEN,
            token: auth
        },
        queryParams: {
            status: 'published'
        }
    });

    return result.body['campaigns'];
}

export async function getWorkflows(auth: string): Promise<any> {
    const result = await httpClient.sendRequest({
        url: `${baseUrl}/workflows`,
        method: HttpMethod.GET,
        authentication: {
            type: AuthenticationType.BEARER_TOKEN,
            token: auth
        }
    });

    return result.body['workflows'];
}

export async function getTimezones(auth: string): Promise<string[]> {
    const result = await httpClient.sendRequest({
        url: `${baseUrl}/timezones`,
        method: HttpMethod.GET,
        authentication: {
            type: AuthenticationType.BEARER_TOKEN,
            token: auth
        }
    });

    return result.body['timezones'];
}

export async function getTags(auth: string): Promise<any[]> {
    const result = await httpClient.sendRequest({
        url: `${baseUrl}/tags`,
        method: HttpMethod.GET,
        authentication: {
            type: AuthenticationType.BEARER_TOKEN,
            token: auth
        }
    });

    return result.body['tags'];
}

export async function addContact(auth: string, contact: LeadConnectorContactDto) {
    const result = await httpClient.sendRequest({
        url: `${baseUrl}/contacts`,
        method: HttpMethod.POST,
        authentication: {
            type: AuthenticationType.BEARER_TOKEN,
            token: auth
        },
        body: contact
    });

    return result.body['contact'];
}

export async function updateContact(auth: string, id: string, data: LeadConnectorContactDto) {
    const result = await httpClient.sendRequest({
        url: `${baseUrl}/contacts/${id}`,
        method: HttpMethod.PUT,
        authentication: {
            type: AuthenticationType.BEARER_TOKEN,
            token: auth
        },
        body: data
    });

    return result.body['contact'];
}

export async function getCountries(): Promise<Country[]> {
    const result: any = await httpClient.sendRequest({
        url: `http://api.worldbank.org/v2/country?format=json&per_page=300`,
        method: HttpMethod.GET
    });
    const countries = result.body[1] as Country[];

    // FREE PALESTINE
    countries.splice(countries.findIndex((country) => country.id == 'ISR'), 1, {
        id: 'PSE',
        name: 'Palestine',
        iso2Code: 'PS'
    });
    return countries;
}

export async function getContacts(auth: string, filters?: {
    startAfterId?: string,
    sortOrder?: 'asc' | 'desc',
    sortBy?: 'date_added' | 'date_updated',
    query?: string
}): Promise<LeadConnectorContact[]> {
    const queryParams: any = {
        limit: '100'
    };

    if (filters?.startAfterId) queryParams.startAfterId = filters.startAfterId;
    if (filters?.sortOrder) queryParams.order = filters.sortOrder;
    if (filters?.sortBy) queryParams.sortBy = filters.sortBy;
    if (filters?.query) queryParams.query = filters.query;

    const response = await httpClient.sendRequest({
        url: `${baseUrl}/contacts`,
        method: HttpMethod.GET,
        authentication: {
            type: AuthenticationType.BEARER_TOKEN,
            token: auth
        },
        queryParams: queryParams
    });
    const result = response.body['contacts'] as LeadConnectorContact[];
    return result;
}

export async function getForms(auth: string): Promise<LeadConnectorForm[]> {
    const response = await httpClient.sendRequest({
        url: `${baseUrl}/forms`,
        method: HttpMethod.GET,
        authentication: {
            type: AuthenticationType.BEARER_TOKEN,
            token: auth
        }
    });
    const result = response.body['forms'] as LeadConnectorForm[];
    return result;
}

export async function getFormSubmissions(auth: string, formId: string): Promise<any[]> {
    const response = await httpClient.sendRequest({
        url: `${baseUrl}/forms/submissions`,
        method: HttpMethod.GET,
        authentication: {
            type: AuthenticationType.BEARER_TOKEN,
            token: auth
        },
        queryParams: {
            limit: '100',
            formId: formId
        }
    });

    return response.body['submissions'];
}

export async function addContactToCampaign(auth: string, contact: string, campaign: string) {
    const response = await httpClient.sendRequest({
        url: `${baseUrl}/contacts/${contact}/campaigns/${campaign}`,
        method: HttpMethod.POST,
        authentication: {
            type: AuthenticationType.BEARER_TOKEN,
            token: auth
        }
    });

    return response.body;
}

export async function addContactToWorkflow(auth: string, contact: string, workflow: string) {
    const response = await httpClient.sendRequest({
        url: `${baseUrl}/contacts/${contact}/workflow/${workflow}`,
        method: HttpMethod.POST,
        authentication: {
            type: AuthenticationType.BEARER_TOKEN,
            token: auth
        }
    });

    return response.body;
}

export async function addNoteToContact(auth: string, contact: string, data: {
    body: string,
    userId: string
}) {
    const response = await httpClient.sendRequest({
        url: `${baseUrl}/contacts/${contact}/notes`,
        method: HttpMethod.POST,
        authentication: {
            type: AuthenticationType.BEARER_TOKEN,
            token: auth
        },
        body: data
    });

    return response.body;
}

export async function getPipelines(auth: string): Promise<any[]> {
    const response = await httpClient.sendRequest({
        url: `${baseUrl}/pipelines`,
        method: HttpMethod.GET,
        authentication: {
            type: AuthenticationType.BEARER_TOKEN,
            token: auth
        }
    });
    const result = response.body['pipelines'];
    return result;
}

export async function getPipeline(auth: string, pipelineId: string): Promise<any> {
    const pipelines = await getPipelines(auth);
    return pipelines.find((pipeline: any) => pipeline.id == pipelineId);
}

export async function getOpportunities(auth: string, pipeline: string, filters?: {
    startAfterId?: string
}): Promise<any> {
    const queryParams: any = {
        limit: '100'
    };
    if (filters?.startAfterId) queryParams.startAfterId = filters.startAfterId;

    const response = await httpClient.sendRequest({
        url: `${baseUrl}/pipelines/${pipeline}/opportunities`,
        method: HttpMethod.GET,
        authentication: {
            type: AuthenticationType.BEARER_TOKEN,
            token: auth
        },
        queryParams: queryParams
    });
    const result = response.body['opportunities'];
    return result;
}

export async function getOpportunity(auth: string, pipeline: string, opportunity: string): Promise<any> {
    const response = await httpClient.sendRequest({
        url: `${baseUrl}/pipelines/${pipeline}/opportunities/${opportunity}`,
        method: HttpMethod.GET,
        authentication: {
            type: AuthenticationType.BEARER_TOKEN,
            token: auth
        }
    });

    const result = response.body;
    return result;
}

export async function createOpportunity(auth: string, pipeline: string, data: LeadConnectorOpportunityDto) {
    const result = await httpClient.sendRequest({
        url: `${baseUrl}/pipelines/${pipeline}/opportunities`,
        method: HttpMethod.POST,
        authentication: {
            type: AuthenticationType.BEARER_TOKEN,
            token: auth
        },
        body: data
    });

    return result.body;
}

export async function updateOpportunity(auth: string, pipeline: string, opportunity: string, data: LeadConnectorOpportunityDto) {
    const result = await httpClient.sendRequest({
        url: `${baseUrl}/pipelines/${pipeline}/opportunities/${opportunity}`,
        method: HttpMethod.PUT,
        authentication: {
            type: AuthenticationType.BEARER_TOKEN,
            token: auth
        },
        body: data
    });

    return result.body;
}

export async function getUsers(auth: string): Promise<any> {
    const response = await httpClient.sendRequest({
        url: `${baseUrl}/users/location`,
        method: HttpMethod.GET,
        authentication: {
            type: AuthenticationType.BEARER_TOKEN,
            token: auth
        }
    });
    const result = response.body['users'];
    return result;
}

export async function getTasks(auth: string, contact: string): Promise<any> {
    const response = await httpClient.sendRequest({
        url: `${baseUrl}/contacts/${contact}/tasks`,
        method: HttpMethod.GET,
        authentication: {
            type: AuthenticationType.BEARER_TOKEN,
            token: auth
        }
    });
    const result = response.body['tasks'];
    return result;
}

export async function getTask(auth: string, contact: string, task: string): Promise<any> {
    const response = await httpClient.sendRequest({
        url: `${baseUrl}/contacts/${contact}/tasks/${task}`,
        method: HttpMethod.GET,
        authentication: {
            type: AuthenticationType.BEARER_TOKEN,
            token: auth
        }
    });
    const result = response.body;
    return result;
}

export async function createTask(auth: string, contact: string, task: LeadConnectorTaskDto) {
    const result = await httpClient.sendRequest({
        url: `${baseUrl}/contacts/${contact}/tasks`,
        method: HttpMethod.POST,
        authentication: {
            type: AuthenticationType.BEARER_TOKEN,
            token: auth
        },
        body: task
    });

    return result.body;
}

export async function updateTask(auth: string, contact: string, task: string, data: LeadConnectorTaskDto) {
    const result = await httpClient.sendRequest({
        url: `${baseUrl}/contacts/${contact}/tasks/${task}`,
        method: HttpMethod.PUT,
        authentication: {
            type: AuthenticationType.BEARER_TOKEN,
            token: auth
        },
        body: data
    });

    return result.body;
}

export interface LeadConnectorContact {
    id: string
    locationId: string
    firstName: string
    lastName: string
    contactName: string
    email: string
    phone: string
    companyName: string
    website: string
    tags: string[]
    source: string
    country: string
    city: string
    state: string
    address: string
    postalCode: string
    timezone: string
    dnd: boolean
    type: string
    customField: any[]
    dateAdded: string
    dateUpdated: string
}

export interface LeadConnectorContactDto {
    locationId?: string
    firstName?: string
    lastName?: string
    email?: string
    phone?: string
    companyName?: string
    website?: string
    tags?: string[]
    source?: string
    country?: string
    city?: string
    state?: string
    address?: string
    postalCode?: string
    timezone?: string
}

export interface LeadConnectorForm {
    id: string
    name: string
}

export interface LeadConnectorTaskDto {
    title: string
    dueDate: string
    description?: string
    assignedTo?: string
    status?: LeadConnectorTaskStatus
}

export interface LeadConnectorOpportunityDto {
    title: string
    stageId: string
    contactId?: string
    status: LeadConnectorOpportunityStatus
    monetaryValue?: number
    assignedTo?: string
}

export enum LeadConnectorTaskStatus {
    COMPLETED = 'completed',
    INCOMPLETED = 'incompleted'
}

export enum LeadConnectorOpportunityStatus {
    OPEN = 'open',
    WON = 'won',
    LOST = 'lost',
    ABANDONED = 'abandoned'
}

export interface Country {
    id: string
    name: string
    iso2Code: string
}