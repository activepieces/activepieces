export class WealthboxClient {
  private baseUrl = 'https://api.crmworkspace.com/v1';
  private accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Authorization': `Bearer ${this.accessToken}`,
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

  async listContacts() {
    return this.makeRequest('/contacts');
  }

  async getContact(id: number) {
    return this.makeRequest(`/contacts/${id}`);
  }

  async createContact(contactData: any) {
    return this.makeRequest('/contacts', {
      method: 'POST',
      body: JSON.stringify(contactData),
    });
  }

  async updateContact(id: number, contactData: any) {
    return this.makeRequest(`/contacts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(contactData),
    });
  }

  async deleteContact(id: number) {
    return this.makeRequest(`/contacts/${id}`, {
      method: 'DELETE',
    });
  }

  async listTasks() {
    return this.makeRequest('/tasks');
  }

  async getTask(id: number) {
    return this.makeRequest(`/tasks/${id}`);
  }

  async createTask(taskData: any) {
    return this.makeRequest('/tasks', {
      method: 'POST',
      body: JSON.stringify(taskData),
    });
  }

  async updateTask(id: number, taskData: any) {
    return this.makeRequest(`/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(taskData),
    });
  }

  async deleteTask(id: number) {
    return this.makeRequest(`/tasks/${id}`, {
      method: 'DELETE',
    });
  }

  async listEvents() {
    return this.makeRequest('/events');
  }

  async getEvent(id: number) {
    return this.makeRequest(`/events/${id}`);
  }

  async createEvent(eventData: any) {
    return this.makeRequest('/events', {
      method: 'POST',
      body: JSON.stringify(eventData),
    });
  }

  async updateEvent(id: number, eventData: any) {
    return this.makeRequest(`/events/${id}`, {
      method: 'PUT',
      body: JSON.stringify(eventData),
    });
  }

  async deleteEvent(id: number) {
    return this.makeRequest(`/events/${id}`, {
      method: 'DELETE',
    });
  }

  async listOpportunities() {
    return this.makeRequest('/opportunities');
  }

  async getOpportunity(id: number) {
    return this.makeRequest(`/opportunities/${id}`);
  }

  async createOpportunity(opportunityData: any) {
    return this.makeRequest('/opportunities', {
      method: 'POST',
      body: JSON.stringify(opportunityData),
    });
  }

  async updateOpportunity(id: number, opportunityData: any) {
    return this.makeRequest(`/opportunities/${id}`, {
      method: 'PUT',
      body: JSON.stringify(opportunityData),
    });
  }

  async deleteOpportunity(id: number) {
    return this.makeRequest(`/opportunities/${id}`, {
      method: 'DELETE',
    });
  }

  async listProjects() {
    return this.makeRequest('/projects');
  }

  async getProject(id: number) {
    return this.makeRequest(`/projects/${id}`);
  }

  async createProject(projectData: any) {
    return this.makeRequest('/projects', {
      method: 'POST',
      body: JSON.stringify(projectData),
    });
  }

  async updateProject(id: number, projectData: any) {
    return this.makeRequest(`/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(projectData),
    });
  }

  async deleteProject(id: number) {
    return this.makeRequest(`/projects/${id}`, {
      method: 'DELETE',
    });
  }

  async listNotes() {
    return this.makeRequest('/notes');
  }

  async getNote(id: number) {
    return this.makeRequest(`/notes/${id}`);
  }

  async createNote(noteData: any) {
    return this.makeRequest('/notes', {
      method: 'POST',
      body: JSON.stringify(noteData),
    });
  }

  async updateNote(id: number, noteData: any) {
    return this.makeRequest(`/notes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(noteData),
    });
  }

  async listWorkflows() {
    return this.makeRequest('/workflows');
  }

  async getWorkflow(id: number) {
    return this.makeRequest(`/workflows/${id}`);
  }

  async createWorkflow(workflowData: any) {
    return this.makeRequest('/workflows', {
      method: 'POST',
      body: JSON.stringify(workflowData),
    });
  }

  async deleteWorkflow(id: number) {
    return this.makeRequest(`/workflows/${id}`, {
      method: 'DELETE',
    });
  }

  async listWorkflowTemplates() {
    return this.makeRequest('/workflow_templates');
  }

  async getWorkflowTemplate(id: number) {
    return this.makeRequest(`/workflow_templates/${id}`);
  }

  async listWorkflowSteps() {
    return this.makeRequest('/workflow_steps');
  }

  async completeWorkflowStep(id: number, stepData: any) {
    return this.makeRequest(`/workflow_steps/${id}/complete`, {
      method: 'POST',
      body: JSON.stringify(stepData),
    });
  }

  async revertWorkflowStep(id: number) {
    return this.makeRequest(`/workflow_steps/${id}/revert`, {
      method: 'POST',
    });
  }

  async listUsers() {
    return this.makeRequest('/users');
  }

  async listTeams() {
    return this.makeRequest('/teams');
  }

  async listUserGroups() {
    return this.makeRequest('/user_groups');
  }

  async listTags() {
    return this.makeRequest('/tags');
  }

  async listCustomFields() {
    return this.makeRequest('/custom_fields');
  }

  async listCategories(type: string) {
    return this.makeRequest(`/categories/${type}`);
  }

  async listComments(resourceId?: number, resourceType?: string) {
    let endpoint = '/comments';
    const params = new URLSearchParams();
    
    if (resourceId) params.append('resource_id', resourceId.toString());
    if (resourceType) params.append('resource_type', resourceType);
    
    if (params.toString()) {
      endpoint += `?${params.toString()}`;
    }
    
    return this.makeRequest(endpoint);
  }

  async addHouseholdMember(householdId: number, memberData: any) {
    return this.makeRequest(`/households/${householdId}/members`, {
      method: 'POST',
      body: JSON.stringify(memberData),
    });
  }

  async removeHouseholdMember(householdId: number, memberId: number) {
    return this.makeRequest(`/households/${householdId}/members/${memberId}`, {
      method: 'DELETE',
    });
  }

  async searchContacts(query: string) {
    const contacts = await this.listContacts();
    return {
      contacts: contacts.contacts.filter((contact: any) => 
        contact.first_name?.toLowerCase().includes(query.toLowerCase()) ||
        contact.last_name?.toLowerCase().includes(query.toLowerCase()) ||
        contact.email?.toLowerCase().includes(query.toLowerCase()) ||
        contact.phone?.includes(query)
      )
    };
  }

  async searchTasks(query: string) {
    const tasks = await this.listTasks();
    return {
      tasks: tasks.tasks.filter((task: any) => 
        task.subject?.toLowerCase().includes(query.toLowerCase()) ||
        task.description?.toLowerCase().includes(query.toLowerCase())
      )
    };
  }
}
