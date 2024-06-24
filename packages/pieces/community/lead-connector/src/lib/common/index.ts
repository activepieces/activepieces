import {
  httpClient,
  HttpMethod,
  AuthenticationType,
} from '@activepieces/pieces-common';
import { OAuth2PropertyValue } from '@activepieces/pieces-framework';
import jwt from 'jsonwebtoken';

export const baseUrl = 'https://services.leadconnectorhq.com';

export const leadConnectorHeaders = {
  Version: '2021-07-28',
};

export async function getCampaigns(auth: OAuth2PropertyValue): Promise<any> {
  const result = await httpClient.sendRequest({
    url: `${baseUrl}/campaigns/`,
    method: HttpMethod.GET,
    headers: leadConnectorHeaders,
    authentication: {
      type: AuthenticationType.BEARER_TOKEN,
      token: auth.access_token,
    },
    queryParams: {
      // status: 'published',
      locationId: auth.data['locationId'],
    },
  });

  return result.body['campaigns'];
}

export async function getWorkflows(auth: OAuth2PropertyValue): Promise<any> {
  const result = await httpClient.sendRequest({
    url: `${baseUrl}/workflows/`,
    method: HttpMethod.GET,
    headers: leadConnectorHeaders,
    authentication: {
      type: AuthenticationType.BEARER_TOKEN,
      token: auth.access_token,
    },
    queryParams: {
      locationId: auth.data['locationId'],
    },
  });

  return result.body['workflows'];
}

export async function getTimezones(
  auth: OAuth2PropertyValue
): Promise<string[]> {
  const result = await httpClient.sendRequest({
    url: `${baseUrl}/locations/${auth.data['locationId']}/timezones`,
    method: HttpMethod.GET,
    headers: leadConnectorHeaders,
    authentication: {
      type: AuthenticationType.BEARER_TOKEN,
      token: auth.access_token,
    },
  });

  return result.body['timeZones'];
}

export async function getTags(auth: OAuth2PropertyValue): Promise<any[]> {
  const result = await httpClient.sendRequest({
    url: `${baseUrl}/locations/${auth.data['locationId']}/tags`,
    method: HttpMethod.GET,
    headers: leadConnectorHeaders,
    authentication: {
      type: AuthenticationType.BEARER_TOKEN,
      token: auth.access_token,
    },
  });

  return result.body['tags'];
}

export async function addContact(
  auth: OAuth2PropertyValue,
  contact: LeadConnectorContactDto
) {
  contact.locationId = auth.data['locationId'];

  const result = await httpClient.sendRequest({
    url: `${baseUrl}/contacts/`,
    method: HttpMethod.POST,
    headers: leadConnectorHeaders,
    authentication: {
      type: AuthenticationType.BEARER_TOKEN,
      token: auth.access_token,
    },
    body: contact,
  });

  return result.body['contact'];
}

export async function updateContact(
  auth: string,
  id: string,
  data: LeadConnectorContactDto
) {
  const result = await httpClient.sendRequest({
    url: `${baseUrl}/contacts/${id}`,
    method: HttpMethod.PUT,
    headers: leadConnectorHeaders,
    authentication: {
      type: AuthenticationType.BEARER_TOKEN,
      token: auth,
    },
    body: data,
  });

  return result.body['contact'];
}

export async function getCountries(): Promise<Country[]> {
  const result: any = await httpClient.sendRequest({
    url: `http://api.worldbank.org/v2/country?format=json&per_page=300`,
    method: HttpMethod.GET,
  });
  const countries = result.body[1] as Country[];

  // FREE PALESTINE
  countries.splice(
    countries.findIndex((country) => country.id == 'ISR'),
    1,
    {
      id: 'PSE',
      name: 'Palestine',
      iso2Code: 'PS',
    }
  );
  return countries;
}

export async function getContacts(
  auth: OAuth2PropertyValue,
  filters?: {
    startAfterId?: string;
    sortOrder?: 'asc' | 'desc';
    sortBy?: 'date_added' | 'date_updated';
    query?: string;
  }
): Promise<LeadConnectorContact[]> {
  const queryParams: any = {
    limit: '100',
    locationId: auth.data['locationId'],
  };

  if (filters?.startAfterId) queryParams.startAfterId = filters.startAfterId;
  if (filters?.sortOrder) queryParams.order = filters.sortOrder;
  if (filters?.sortBy) queryParams.sortBy = filters.sortBy;
  if (filters?.query) queryParams.query = filters.query;

  const response = await httpClient.sendRequest({
    url: `${baseUrl}/contacts/`,
    method: HttpMethod.GET,
    headers: leadConnectorHeaders,
    authentication: {
      type: AuthenticationType.BEARER_TOKEN,
      token: auth.access_token,
    },
    queryParams: queryParams,
  });
  const result = response.body['contacts'] as LeadConnectorContact[];
  return result;
}

export async function getForms(
  auth: OAuth2PropertyValue
): Promise<LeadConnectorForm[]> {
  const response = await httpClient.sendRequest({
    url: `${baseUrl}/forms/`,
    method: HttpMethod.GET,
    headers: leadConnectorHeaders,
    authentication: {
      type: AuthenticationType.BEARER_TOKEN,
      token: auth.access_token,
    },
    queryParams: {
      locationId: auth.data['locationId'],
    },
  });
  const result = response.body['forms'] as LeadConnectorForm[];
  return result;
}

export async function getFormSubmissions(
  auth: OAuth2PropertyValue,
  formId: string
): Promise<any[]> {
  const response = await httpClient.sendRequest({
    url: `${baseUrl}/forms/submissions/`,
    method: HttpMethod.GET,
    headers: leadConnectorHeaders,
    authentication: {
      type: AuthenticationType.BEARER_TOKEN,
      token: auth.access_token,
    },
    queryParams: {
      limit: '100',
      formId,
      locationId: auth.data['locationId'],
    },
  });

  return response.body['submissions'];
}

export async function addContactToCampaign(
  auth: string,
  contact: string,
  campaign: string
) {
  const response = await httpClient.sendRequest({
    url: `${baseUrl}/contacts/${contact}/campaigns/${campaign}`,
    method: HttpMethod.POST,
    headers: leadConnectorHeaders,
    authentication: {
      type: AuthenticationType.BEARER_TOKEN,
      token: auth,
    },
  });

  return response.body;
}

export async function addContactToWorkflow(
  auth: string,
  contact: string,
  workflow: string
) {
  const response = await httpClient.sendRequest({
    url: `${baseUrl}/contacts/${contact}/workflow/${workflow}`,
    method: HttpMethod.POST,
    headers: leadConnectorHeaders,
    authentication: {
      type: AuthenticationType.BEARER_TOKEN,
      token: auth,
    },
  });

  return response.body;
}

export async function addNoteToContact(
  auth: string,
  contact: string,
  data: {
    body: string;
    userId: string;
  }
) {
  const response = await httpClient.sendRequest({
    url: `${baseUrl}/contacts/${contact}/notes/`,
    method: HttpMethod.POST,
    headers: leadConnectorHeaders,
    authentication: {
      type: AuthenticationType.BEARER_TOKEN,
      token: auth,
    },
    body: data,
  });

  return response.body;
}

export async function getPipelines(auth: OAuth2PropertyValue): Promise<any[]> {
  const response = await httpClient.sendRequest({
    url: `${baseUrl}/opportunities/pipelines`,
    method: HttpMethod.GET,
    headers: leadConnectorHeaders,
    authentication: {
      type: AuthenticationType.BEARER_TOKEN,
      token: auth.access_token,
    },
    queryParams: {
      locationId: auth.data['locationId'],
    },
  });
  const result = response.body['pipelines'];
  return result;
}

export async function getPipeline(
  auth: OAuth2PropertyValue,
  pipelineId: string
): Promise<any> {
  const pipelines = await getPipelines(auth);
  return pipelines.find((pipeline: any) => pipeline.id == pipelineId);
}

export async function getOpportunities(
  auth: OAuth2PropertyValue,
  pipeline: string,
  filters?: {
    startAfterId?: string;
  }
): Promise<any> {
  const queryParams: any = {
    limit: '100',
    location_id: auth.data['locationId'],
    pipeline_id: pipeline,
  };
  if (filters?.startAfterId) queryParams.startAfterId = filters.startAfterId;

  const response = await httpClient.sendRequest({
    url: `${baseUrl}/opportunities/search`,
    method: HttpMethod.GET,
    headers: leadConnectorHeaders,
    authentication: {
      type: AuthenticationType.BEARER_TOKEN,
      token: auth.access_token,
    },
    queryParams: queryParams,
  });
  const result = response.body['opportunities'];
  return result;
}

export async function getOpportunity(
  auth: string,
  pipeline: string,
  opportunity: string
): Promise<any> {
  const response = await httpClient.sendRequest({
    url: `${baseUrl}/opportunities/${opportunity}`,
    method: HttpMethod.GET,
    headers: leadConnectorHeaders,
    authentication: {
      type: AuthenticationType.BEARER_TOKEN,
      token: auth,
    },
  });

  const result = response.body;
  return result;
}

export async function createOpportunity(
  auth: OAuth2PropertyValue,
  data: LeadConnectorOpportunityDto
) {
  data.locationId = auth.data['locationId'];
  const result = await httpClient.sendRequest({
    url: `${baseUrl}/opportunities/`,
    method: HttpMethod.POST,
    headers: leadConnectorHeaders,
    authentication: {
      type: AuthenticationType.BEARER_TOKEN,
      token: auth.access_token,
    },
    body: data,
  });

  return result.body;
}

export async function updateOpportunity(
  auth: string,
  opportunity: string,
  data: LeadConnectorOpportunityDto
) {
  const result = await httpClient.sendRequest({
    url: `${baseUrl}/opportunities/${opportunity}`,
    method: HttpMethod.PUT,
    headers: leadConnectorHeaders,
    authentication: {
      type: AuthenticationType.BEARER_TOKEN,
      token: auth,
    },
    body: data,
  });

  return result.body;
}

export async function getUsers(auth: OAuth2PropertyValue): Promise<any> {
  const response = await httpClient.sendRequest({
    url: `${baseUrl}/users/search`,
    method: HttpMethod.GET,
    headers: leadConnectorHeaders,
    authentication: {
      type: AuthenticationType.BEARER_TOKEN,
      token: auth.access_token,
    },
    queryParams: {
      locationId: auth.data['locationId'],
      companyId: auth.data['companyId'],
    },
  });
  const result = response.body['users'];
  return result;
}

export async function getTasks(auth: string, contact: string): Promise<any> {
  const response = await httpClient.sendRequest({
    url: `${baseUrl}/contacts/${contact}/tasks`,
    method: HttpMethod.GET,
    headers: leadConnectorHeaders,
    authentication: {
      type: AuthenticationType.BEARER_TOKEN,
      token: auth,
    },
  });
  const result = response.body['tasks'];
  return result;
}

export async function getTask(
  auth: string,
  contact: string,
  task: string
): Promise<any> {
  const response = await httpClient.sendRequest({
    url: `${baseUrl}/contacts/${contact}/tasks/${task}`,
    method: HttpMethod.GET,
    headers: leadConnectorHeaders,
    authentication: {
      type: AuthenticationType.BEARER_TOKEN,
      token: auth,
    },
  });
  const result = response.body;
  return result;
}

export async function createTask(
  auth: string,
  contact: string,
  task: LeadConnectorTaskDto
) {
  const result = await httpClient.sendRequest({
    url: `${baseUrl}/contacts/${contact}/tasks`,
    method: HttpMethod.POST,
    headers: leadConnectorHeaders,
    authentication: {
      type: AuthenticationType.BEARER_TOKEN,
      token: auth,
    },
    body: task,
  });

  return result.body;
}

export async function updateTask(
  auth: string,
  contact: string,
  task: string,
  data: Partial<LeadConnectorTaskDto>
) {
  const result = await httpClient.sendRequest({
    url: `${baseUrl}/contacts/${contact}/tasks/${task}`,
    method: HttpMethod.PUT,
    headers: leadConnectorHeaders,
    authentication: {
      type: AuthenticationType.BEARER_TOKEN,
      token: auth,
    },
    body: data,
  });

  return result.body;
}

export function getLocationIdFromToken(auth: OAuth2PropertyValue): {
  authClass: string;
  authClassId: string;
} {
  const result = jwt.decode(auth.access_token);

  return result as { authClass: string; authClassId: string };
}

export interface LeadConnectorContact {
  id: string;
  locationId: string;
  firstName: string;
  lastName: string;
  contactName: string;
  email: string;
  phone: string;
  companyName: string;
  website: string;
  tags: string[];
  source: string;
  country: string;
  city: string;
  state: string;
  address: string;
  postalCode: string;
  timezone: string;
  dnd: boolean;
  type: string;
  customField: any[];
  dateAdded: string;
  dateUpdated: string;
}

export interface LeadConnectorContactDto {
  locationId?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  companyName?: string;
  website?: string;
  tags?: string[];
  source?: string;
  country?: string;
  city?: string;
  state?: string;
  address1?: string;
  postalCode?: string;
  timezone?: string;
}

export interface LeadConnectorForm {
  id: string;
  name: string;
}

export interface LeadConnectorTaskDto {
  title: string;
  dueDate: string;
  body?: string;
  assignedTo?: string;
  completed?: boolean;
}

export interface LeadConnectorOpportunityDto {
  name: string;
  pipelineId: string;
  pipelineStageId: string;
  locationId?: string;
  contactId?: string;
  status: LeadConnectorOpportunityStatus;
  monetaryValue?: number;
  assignedTo?: string;
}

export enum LeadConnectorTaskStatus {
  COMPLETED = 'completed',
  INCOMPLETED = 'incompleted',
}

export enum LeadConnectorOpportunityStatus {
  OPEN = 'open',
  WON = 'won',
  LOST = 'lost',
  ABANDONED = 'abandoned',
}

export interface Country {
  id: string;
  name: string;
  iso2Code: string;
}

export interface LeadConnectorLocation {
  id: string;
  name: string;
  phone: string;
  email: string;
  country: string;
  timezone: string;
}
