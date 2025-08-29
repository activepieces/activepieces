import { OAuth2PropertyValue } from '@activepieces/pieces-framework';

export interface WealthboxContact {
  id?: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
  };
  tags?: string[];
  household_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface WealthboxTask {
  id?: string;
  title: string;
  description?: string;
  due_date?: string;
  completed?: boolean;
  contact_id?: string;
  assigned_to?: string;
  priority?: 'low' | 'medium' | 'high';
  created_at?: string;
  updated_at?: string;
}

export interface WealthboxEvent {
  id?: string;
  title: string;
  description?: string;
  start_date: string;
  end_date?: string;
  contact_id?: string;
  location?: string;
  created_at?: string;
  updated_at?: string;
}

export interface WealthboxOpportunity {
  id?: string;
  title: string;
  description?: string;
  stage: string;
  amount?: number;
  close_date?: string;
  contact_id?: string;
  probability?: number;
  created_at?: string;
  updated_at?: string;
}

export interface WealthboxProject {
  id?: string;
  name: string;
  description?: string;
  organizer_id?: string;
  status?: 'active' | 'completed' | 'cancelled';
  created_at?: string;
  updated_at?: string;
}

export interface WealthboxHousehold {
  id?: string;
  name: string;
  emails?: string[];
  tags?: string[];
  created_at?: string;
  updated_at?: string;
}

export interface WealthboxNote {
  id?: string;
  content: string;
  contact_id: string;
  created_at?: string;
  updated_at?: string;
}

export interface WealthboxWorkflow {
  id?: string;
  name: string;
  template_id: string;
  contact_id?: string;
  project_id?: string;
  opportunity_id?: string;
  created_at?: string;
  updated_at?: string;
}

export class WealthboxClient {
  constructor(private auth: OAuth2PropertyValue) {}

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `https://api.wealthbox.com/v1${endpoint}`;
    const headers = {
      'Authorization': `Bearer ${this.auth.access_token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      throw new Error(`Wealthbox API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // Contact methods
  async getContacts(params?: { limit?: number; offset?: number }): Promise<{ data: WealthboxContact[] }> {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());
    
    return this.makeRequest(`/contacts?${queryParams.toString()}`);
  }

  async getContact(id: string): Promise<WealthboxContact> {
    return this.makeRequest(`/contacts/${id}`);
  }

  async createContact(contact: Omit<WealthboxContact, 'id' | 'created_at' | 'updated_at'>): Promise<WealthboxContact> {
    return this.makeRequest('/contacts', {
      method: 'POST',
      body: JSON.stringify(contact),
    });
  }

  async updateContact(id: string, contact: Partial<WealthboxContact>): Promise<WealthboxContact> {
    return this.makeRequest(`/contacts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(contact),
    });
  }

  async searchContacts(query: string): Promise<{ data: WealthboxContact[] }> {
    return this.makeRequest(`/contacts/search?q=${encodeURIComponent(query)}`);
  }

  // Task methods
  async getTasks(params?: { limit?: number; offset?: number }): Promise<{ data: WealthboxTask[] }> {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());
    
    return this.makeRequest(`/tasks?${queryParams.toString()}`);
  }

  async getTask(id: string): Promise<WealthboxTask> {
    return this.makeRequest(`/tasks/${id}`);
  }

  async createTask(task: Omit<WealthboxTask, 'id' | 'created_at' | 'updated_at'>): Promise<WealthboxTask> {
    return this.makeRequest('/tasks', {
      method: 'POST',
      body: JSON.stringify(task),
    });
  }

  async updateTask(id: string, task: Partial<WealthboxTask>): Promise<WealthboxTask> {
    return this.makeRequest(`/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(task),
    });
  }

  async searchTasks(query: string): Promise<{ data: WealthboxTask[] }> {
    return this.makeRequest(`/tasks/search?q=${encodeURIComponent(query)}`);
  }

  // Event methods
  async getEvents(params?: { limit?: number; offset?: number }): Promise<{ data: WealthboxEvent[] }> {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());
    
    return this.makeRequest(`/events?${queryParams.toString()}`);
  }

  async getEvent(id: string): Promise<WealthboxEvent> {
    return this.makeRequest(`/events/${id}`);
  }

  async createEvent(event: Omit<WealthboxEvent, 'id' | 'created_at' | 'updated_at'>): Promise<WealthboxEvent> {
    return this.makeRequest('/events', {
      method: 'POST',
      body: JSON.stringify(event),
    });
  }

  async updateEvent(id: string, event: Partial<WealthboxEvent>): Promise<WealthboxEvent> {
    return this.makeRequest(`/events/${id}`, {
      method: 'PUT',
      body: JSON.stringify(event),
    });
  }

  // Opportunity methods
  async getOpportunities(params?: { limit?: number; offset?: number }): Promise<{ data: WealthboxOpportunity[] }> {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());
    
    return this.makeRequest(`/opportunities?${queryParams.toString()}`);
  }

  async getOpportunity(id: string): Promise<WealthboxOpportunity> {
    return this.makeRequest(`/opportunities/${id}`);
  }

  async createOpportunity(opportunity: Omit<WealthboxOpportunity, 'id' | 'created_at' | 'updated_at'>): Promise<WealthboxOpportunity> {
    return this.makeRequest('/opportunities', {
      method: 'POST',
      body: JSON.stringify(opportunity),
    });
  }

  async updateOpportunity(id: string, opportunity: Partial<WealthboxOpportunity>): Promise<WealthboxOpportunity> {
    return this.makeRequest(`/opportunities/${id}`, {
      method: 'PUT',
      body: JSON.stringify(opportunity),
    });
  }

  // Project methods
  async getProjects(params?: { limit?: number; offset?: number }): Promise<{ data: WealthboxProject[] }> {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());
    
    return this.makeRequest(`/projects?${queryParams.toString()}`);
  }

  async getProject(id: string): Promise<WealthboxProject> {
    return this.makeRequest(`/projects/${id}`);
  }

  async createProject(project: Omit<WealthboxProject, 'id' | 'created_at' | 'updated_at'>): Promise<WealthboxProject> {
    return this.makeRequest('/projects', {
      method: 'POST',
      body: JSON.stringify(project),
    });
  }

  async updateProject(id: string, project: Partial<WealthboxProject>): Promise<WealthboxProject> {
    return this.makeRequest(`/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(project),
    });
  }

  // Household methods
  async getHouseholds(params?: { limit?: number; offset?: number }): Promise<{ data: WealthboxHousehold[] }> {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());
    
    return this.makeRequest(`/households?${queryParams.toString()}`);
  }

  async getHousehold(id: string): Promise<WealthboxHousehold> {
    return this.makeRequest(`/households/${id}`);
  }

  async createHousehold(household: Omit<WealthboxHousehold, 'id' | 'created_at' | 'updated_at'>): Promise<WealthboxHousehold> {
    return this.makeRequest('/households', {
      method: 'POST',
      body: JSON.stringify(household),
    });
  }

  async updateHousehold(id: string, household: Partial<WealthboxHousehold>): Promise<WealthboxHousehold> {
    return this.makeRequest(`/households/${id}`, {
      method: 'PUT',
      body: JSON.stringify(household),
    });
  }

  async addMemberToHousehold(householdId: string, contactId: string): Promise<void> {
    return this.makeRequest(`/households/${householdId}/members`, {
      method: 'POST',
      body: JSON.stringify({ contact_id: contactId }),
    });
  }

  // Note methods
  async createNote(note: Omit<WealthboxNote, 'id' | 'created_at' | 'updated_at'>): Promise<WealthboxNote> {
    return this.makeRequest('/notes', {
      method: 'POST',
      body: JSON.stringify(note),
    });
  }

  // Workflow methods
  async startWorkflow(workflow: Omit<WealthboxWorkflow, 'id' | 'created_at' | 'updated_at'>): Promise<WealthboxWorkflow> {
    return this.makeRequest('/workflows', {
      method: 'POST',
      body: JSON.stringify(workflow),
    });
  }
} 