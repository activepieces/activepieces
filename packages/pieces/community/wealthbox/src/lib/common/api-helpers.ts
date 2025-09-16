import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { WEALTHBOX_API_BASE } from './constants';

export const fetchUserGroups = async (auth: string) => {
  const response = await httpClient.sendRequest({
    method: HttpMethod.GET,
    url: `${WEALTHBOX_API_BASE}/user_groups`,
    headers: {
      'ACCESS_TOKEN': auth,
      'Content-Type': 'application/json'
    }
  });

  if (response.status >= 400) {
    throw new Error(`Failed to fetch user groups: ${response.status}`);
  }

  return response.body.user_groups || [];
};

export const fetchContacts = async (auth: string, filters?: { active?: boolean; order?: string }) => {
  const params = new URLSearchParams();
  if (filters?.active !== undefined) params.append('active', filters.active.toString());
  if (filters?.order) params.append('order', filters.order);

  const url = `${WEALTHBOX_API_BASE}/contacts${params.toString() ? '?' + params.toString() : ''}`;

  const response = await httpClient.sendRequest({
    method: HttpMethod.GET,
    url,
    headers: {
      'ACCESS_TOKEN': auth,
      'Content-Type': 'application/json'
    }
  });

  if (response.status >= 400) {
    throw new Error(`Failed to fetch contacts: ${response.status}`);
  }

  return response.body.contacts || [];
};

export const fetchTags = async (auth: string, documentType?: string) => {
  const params = new URLSearchParams();
  if (documentType) params.append('document_type', documentType);

  const url = `${WEALTHBOX_API_BASE}/categories/tags${params.toString() ? '?' + params.toString() : ''}`;

  const response = await httpClient.sendRequest({
    method: HttpMethod.GET,
    url,
    headers: {
      'ACCESS_TOKEN': auth,
      'Content-Type': 'application/json'
    }
  });

  if (response.status >= 400) {
    throw new Error(`Failed to fetch tags: ${response.status}`);
  }

  return response.body.tags || [];
};

export const fetchUsers = async (auth: string) => {
  const response = await httpClient.sendRequest({
    method: HttpMethod.GET,
    url: `${WEALTHBOX_API_BASE}/users`,
    headers: {
      'ACCESS_TOKEN': auth,
      'Content-Type': 'application/json'
    }
  });

  if (response.status >= 400) {
    throw new Error(`Failed to fetch users: ${response.status}`);
  }

  return response.body.users || [];
};

export const fetchCustomFields = async (auth: string, documentType?: string) => {
  const params = new URLSearchParams();
  if (documentType) params.append('document_type', documentType);

  const url = `${WEALTHBOX_API_BASE}/categories/custom_fields${params.toString() ? '?' + params.toString() : ''}`;

  const response = await httpClient.sendRequest({
    method: HttpMethod.GET,
    url,
    headers: {
      'ACCESS_TOKEN': auth,
      'Content-Type': 'application/json'
    }
  });

  if (response.status >= 400) {
    throw new Error(`Failed to fetch custom fields: ${response.status}`);
  }

  return response.body.custom_fields || [];
};

export const fetchEventCategories = async (auth: string) => {
  const response = await httpClient.sendRequest({
    method: HttpMethod.GET,
    url: `${WEALTHBOX_API_BASE}/event_categories`,
    headers: {
      'ACCESS_TOKEN': auth,
      'Content-Type': 'application/json'
    }
  });

  if (response.status >= 400) {
    throw new Error(`Failed to fetch event categories: ${response.status}`);
  }

  return response.body.event_categories || [];
};

export const fetchHouseholds = async (auth: string) => {
  const response = await httpClient.sendRequest({
    method: HttpMethod.GET,
    url: `${WEALTHBOX_API_BASE}/contacts?type=Household&active=true`,
    headers: {
      'ACCESS_TOKEN': auth,
      'Content-Type': 'application/json'
    }
  });

  if (response.status >= 400) {
    throw new Error(`Failed to fetch households: ${response.status}`);
  }

  return response.body.contacts || [];
};

export const fetchOpportunityStages = async (auth: string) => {
  const response = await httpClient.sendRequest({
    method: HttpMethod.GET,
    url: `${WEALTHBOX_API_BASE}/opportunity_stages`,
    headers: {
      'ACCESS_TOKEN': auth,
      'Content-Type': 'application/json'
    }
  });

  if (response.status >= 400) {
    throw new Error(`Failed to fetch opportunity stages: ${response.status}`);
  }

  return response.body.opportunity_stages || [];
};

export const fetchTaskCategories = async (auth: string) => {
  const response = await httpClient.sendRequest({
    method: HttpMethod.GET,
    url: `${WEALTHBOX_API_BASE}/task_categories`,
    headers: {
      'ACCESS_TOKEN': auth,
      'Content-Type': 'application/json'
    }
  });

  if (response.status >= 400) {
    throw new Error(`Failed to fetch task categories: ${response.status}`);
  }

  return response.body.task_categories || [];
};

export const fetchOpportunities = async (auth: string) => {
  const response = await httpClient.sendRequest({
    method: HttpMethod.GET,
    url: `${WEALTHBOX_API_BASE}/opportunities`,
    headers: {
      'ACCESS_TOKEN': auth,
      'Content-Type': 'application/json'
    }
  });

  if (response.status >= 400) {
    throw new Error(`Failed to fetch opportunities: ${response.status}`);
  }

  return response.body.opportunities || [];
};

export const fetchProjects = async (auth: string) => {
  const response = await httpClient.sendRequest({
    method: HttpMethod.GET,
    url: `${WEALTHBOX_API_BASE}/projects`,
    headers: {
      'ACCESS_TOKEN': auth,
      'Content-Type': 'application/json'
    }
  });

  if (response.status >= 400) {
    throw new Error(`Failed to fetch projects: ${response.status}`);
  }

  return response.body.projects || [];
};

export const fetchWorkflowTemplates = async (auth: string) => {
  const response = await httpClient.sendRequest({
    method: HttpMethod.GET,
    url: `${WEALTHBOX_API_BASE}/workflow_templates`,
    headers: {
      'ACCESS_TOKEN': auth,
      'Content-Type': 'application/json'
    }
  });

  if (response.status >= 400) {
    throw new Error(`Failed to fetch workflow templates: ${response.status}`);
  }

  return response.body.workflow_templates || [];
};

export const fetchTasks = async (auth: string, filters?: {
  resource_id?: number;
  resource_type?: string;
  assigned_to?: number;
  completed?: boolean;
  task_type?: string;
  updated_since?: string;
  updated_before?: string;
  limit?: number;
}) => {
  const params = new URLSearchParams();

  if (filters?.resource_id) params.append('resource_id', filters.resource_id.toString());
  if (filters?.resource_type) params.append('resource_type', filters.resource_type);
  if (filters?.assigned_to) params.append('assigned_to', filters.assigned_to.toString());
  if (filters?.completed !== undefined) params.append('completed', filters.completed.toString());
  if (filters?.task_type) params.append('task_type', filters.task_type);
  if (filters?.updated_since) params.append('updated_since', filters.updated_since);
  if (filters?.updated_before) params.append('updated_before', filters.updated_before);
  if (filters?.limit) params.append('limit', filters.limit.toString());

  const url = `${WEALTHBOX_API_BASE}/tasks${params.toString() ? '?' + params.toString() : ''}`;

  const response = await httpClient.sendRequest({
    method: HttpMethod.GET,
    url,
    headers: {
      'ACCESS_TOKEN': auth,
      'Content-Type': 'application/json'
    }
  });

  if (response.status >= 400) {
    throw new Error(`Failed to fetch tasks: ${response.status}`);
  }

  return response.body.tasks || [];
};

export const createApiHeaders = (auth: string) => ({
  'ACCESS_TOKEN': auth,
  'Content-Type': 'application/json'
});

export const handleApiError = (operation: string, status: number, body?: any) => {
  throw new Error(`Wealthbox API error in ${operation}: ${status} - ${JSON.stringify(body)}`);
};
