import {
  AuthenticationType,
  httpClient,
  HttpMethod,
  HttpRequest,
} from '@activepieces/pieces-common';
import { TeamworkAuth } from './auth';

export const teamworkClient = {
  async createCompany(auth: TeamworkAuth, companyData: Record<string, unknown>): Promise<any> {
    const baseUrl =
      auth.region === 'eu'
        ? `https://${auth.site_name}.eu.teamwork.com`
        : `https://${auth.site_name}.teamwork.com`;

    const request: HttpRequest = {
      method: HttpMethod.POST,
      url: `${baseUrl}/companies.json`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: auth.api_key,
      },
      body: {
        company: companyData,
      },
    };

    const response = await httpClient.sendRequest(request);
    return response.body;
  },


  async getProjects(auth: TeamworkAuth): Promise<any[]> {
    const baseUrl =
      auth.region === 'eu'
        ? `https://${auth.site_name}.eu.teamwork.com`
        : `https://${auth.site_name}.teamwork.com`;

    const request: HttpRequest = {
      method: HttpMethod.GET,
      url: `${baseUrl}/projects.json`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: auth.api_key,
      },
    };
    const response = await httpClient.sendRequest<{ projects: any[] }>(request);
    return response.body.projects;
  },

  async getPeopleInProject(auth: TeamworkAuth, projectId: string): Promise<any[]> {
    const baseUrl =
      auth.region === 'eu'
        ? `https://${auth.site_name}.eu.teamwork.com`
        : `https://${auth.site_name}.teamwork.com`;

    const request: HttpRequest = {
      method: HttpMethod.GET,
      url: `${baseUrl}/projects/${projectId}.json?includePeople=true`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: auth.api_key,
      },
    };
    const response = await httpClient.sendRequest<{ project: { people: any[] } }>(request);
    return response.body.project.people;
  },

  async uploadFile(auth: TeamworkAuth, projectId: string, file: any, fileName: string, fileDescription?: string, fileCategory?: string): Promise<any> {
    const baseUrl =
      auth.region === 'eu'
        ? `https://${auth.site_name}.eu.teamwork.com`
        : `https://${auth.site_name}.teamwork.com`;
    
    const pendingFileRequest: HttpRequest = {
      method: HttpMethod.POST,
      url: `${baseUrl}/pendingfiles.json`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: auth.api_key,
      },
      body: {
        file: file
      },
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    };
    const pendingFileResponse = await httpClient.sendRequest<{ pendingFile: { ref: string } }>(pendingFileRequest);
    const pendingFileRef = pendingFileResponse.body.pendingFile.ref;
    return {
      pendingFileRef: pendingFileRef
    };
  },

  async getMessages(auth: TeamworkAuth, projectId: string): Promise<any[]> {
    const baseUrl =
      auth.region === 'eu'
        ? `https://${auth.site_name}.eu.teamwork.com`
        : `https://${auth.site_name}.teamwork.com`;

    const request: HttpRequest = {
      method: HttpMethod.GET,
      url: `${baseUrl}/projects/${projectId}/messages.json`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: auth.api_key,
      },
    };
    const response = await httpClient.sendRequest<{ messages: any[] }>(request);
    return response.body.messages;
  },

  async createMessageReply(auth: TeamworkAuth, messageId: string, replyData: Record<string, unknown>): Promise<any> {
    const baseUrl =
      auth.region === 'eu'
        ? `https://${auth.site_name}.eu.teamwork.com`
        : `https://${auth.site_name}.teamwork.com`;

    const request: HttpRequest = {
      method: HttpMethod.POST,
      url: `${baseUrl}/messages/${messageId}/messageReplies.json`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: auth.api_key,
      },
      body: {
        messagereply: replyData,
      },
    };
    const response = await httpClient.sendRequest(request);
    return response.body;
  },

  async createMilestone(auth: TeamworkAuth, projectId: string, milestoneData: Record<string, unknown>): Promise<any> {
    const baseUrl =
      auth.region === 'eu'
        ? `https://${auth.site_name}.eu.teamwork.com`
        : `https://${auth.site_name}.teamwork.com`;

    const request: HttpRequest = {
      method: HttpMethod.POST,
      url: `${baseUrl}/projects/${projectId}/milestones.json`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: auth.api_key,
      },
      body: milestoneData,
    };
    const response = await httpClient.sendRequest(request);
    return response.body;
  },

  async getNotebooks(auth: TeamworkAuth, projectId: string): Promise<any[]> {
    const baseUrl =
      auth.region === 'eu'
        ? `https://${auth.site_name}.eu.teamwork.com`
        : `https://${auth.site_name}.teamwork.com`;

    const request: HttpRequest = {
      method: HttpMethod.GET,
      url: `${baseUrl}/projects/${projectId}/notebooks.json`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: auth.api_key,
      },
    };
    const response = await httpClient.sendRequest<{ project: { notebooks: any[] } }>(request);
    return response.body.project.notebooks;
  },

  async createComment(auth: TeamworkAuth, resource: string, resourceId: string, commentData: Record<string, unknown>): Promise<any> {
    const baseUrl =
      auth.region === 'eu'
        ? `https://${auth.site_name}.eu.teamwork.com`
        : `https://${auth.site_name}.teamwork.com`;

    const request: HttpRequest = {
      method: HttpMethod.POST,
      url: `${baseUrl}/${resource}/${resourceId}/comments.json`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: auth.api_key,
      },
      body: {
        comment: commentData,
      },
    };
    const response = await httpClient.sendRequest(request);
    return response.body;
  },

  async createPerson(auth: TeamworkAuth, personData: Record<string, unknown>): Promise<any> {
    const baseUrl =
      auth.region === 'eu'
        ? `https://${auth.site_name}.eu.teamwork.com`
        : `https://${auth.site_name}.teamwork.com`;

    const request: HttpRequest = {
      method: HttpMethod.POST,
      url: `${baseUrl}/people.json`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: auth.api_key,
      },
      body: {
        person: personData,
      },
    };
    const response = await httpClient.sendRequest(request);
    return response.body;
  },

  async getCompanies(auth: TeamworkAuth): Promise<any[]> {
    const baseUrl =
      auth.region === 'eu'
        ? `https://${auth.site_name}.eu.teamwork.com`
        : `https://${auth.site_name}.teamwork.com`;
    
    const request: HttpRequest = {
      method: HttpMethod.GET,
      url: `${baseUrl}/companies.json`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: auth.api_key,
      },
    };
    const response = await httpClient.sendRequest<{ companies: any[] }>(request);
    return response.body.companies;
  },

  async createProject(auth: TeamworkAuth, projectData: Record<string, unknown>): Promise<any> {
    const baseUrl =
      auth.region === 'eu'
        ? `https://${auth.site_name}.eu.teamwork.com`
        : `https://${auth.site_name}.teamwork.com`;

    const request: HttpRequest = {
      method: HttpMethod.POST,
      url: `${baseUrl}/projects.json`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: auth.api_key,
      },
      body: {
        project: projectData,
      },
    };
    const response = await httpClient.sendRequest(request);
    return response.body;
  },

  async getPeople(auth: TeamworkAuth, projectId?: string, updatedAfterDate?: string): Promise<any[]> {
    const baseUrl =
      auth.region === 'eu'
        ? `https://${auth.site_name}.eu.teamwork.com`
        : `https://${auth.site_name}.teamwork.com`;

    const queryParams: Record<string, any> = {};
    if (updatedAfterDate) {
      queryParams['updatedAfterDate'] = updatedAfterDate.replace(/[-:]/g, '').replace('T', '').substring(0, 14);
    }
    if (projectId) {
      queryParams['projectId'] = projectId;
    }
    
    const request: HttpRequest = {
      method: HttpMethod.GET,
      url: `${baseUrl}/people.json`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: auth.api_key,
      },
      queryParams,
    };
    const response = await httpClient.sendRequest<{ people: any[] }>(request);
    return response.body.people;
    },

  async createStage(auth: TeamworkAuth, workflowId: string, stageData: Record<string, unknown>): Promise<any> {
    const baseUrl =
      auth.region === 'eu'
        ? `https://${auth.site_name}.eu.teamwork.com`
        : `https://${auth.site_name}.teamwork.com`;
    
    const request: HttpRequest = {
      method: HttpMethod.POST,
      url: `${baseUrl}/projects/api/v3/workflows/${workflowId}/stages.json`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: auth.api_key,
      },
      body: {
        stage: stageData,
      },
    };
    const response = await httpClient.sendRequest(request);
    return response.body;
  },

  async getWorkflows(auth: TeamworkAuth): Promise<any[]> {
    const baseUrl =
      auth.region === 'eu'
        ? `https://${auth.site_name}.eu.teamwork.com`
        : `https://${auth.site_name}.teamwork.com`;

    const request: HttpRequest = {
      method: HttpMethod.GET,
      url: `${baseUrl}/projects/api/v3/workflows.json`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: auth.api_key,
      },
    };
    const response = await httpClient.sendRequest<{ workflows: any[] }>(request);
    return response.body.workflows;
  },

  async getTaskLists(auth: TeamworkAuth, projectId: string): Promise<any[]> {
    const baseUrl =
      auth.region === 'eu'
        ? `https://${auth.site_name}.eu.teamwork.com`
        : `https://${auth.site_name}.teamwork.com`;

    const request: HttpRequest = {
      method: HttpMethod.GET,
      url: `${baseUrl}/projects/api/v3/projects/${projectId}/tasklists.json`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: auth.api_key,
      },
    };
    const response = await httpClient.sendRequest<{ tasklists: any[] }>(request);
    return response.body.tasklists;
  },

  async createTaskList(auth: TeamworkAuth, projectId: string, taskListData: Record<string, unknown>): Promise<any> {
    const baseUrl =
      auth.region === 'eu'
        ? `https://${auth.site_name}.eu.teamwork.com`
        : `https://${auth.site_name}.teamwork.com`;

    const request: HttpRequest = {
      method: HttpMethod.POST,
      url: `${baseUrl}/projects/${projectId}/tasklists.json`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: auth.api_key,
      },
      body: {
        'todo-list': taskListData,
      },
    };
    const response = await httpClient.sendRequest(request);
    return response.body;
  },

  async getTasksInTaskList(auth: TeamworkAuth, tasklistId: string): Promise<any[]> {
    const baseUrl =
      auth.region === 'eu'
        ? `https://${auth.site_name}.eu.teamwork.com`
        : `https://${auth.site_name}.teamwork.com`;

    const request: HttpRequest = {
      method: HttpMethod.GET,
      url: `${baseUrl}/tasklists/${tasklistId}/tasks.json`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: auth.api_key,
      },
    };
    const response = await httpClient.sendRequest<{ tasks: any[] }>(request);
    return response.body.tasks;
  },

  async createTimeEntryOnTask(auth: TeamworkAuth, taskId: string, timeEntryData: Record<string, unknown>): Promise<any> {
    const baseUrl =
      auth.region === 'eu'
        ? `https://${auth.site_name}.eu.teamwork.com`
        : `https://${auth.site_name}.teamwork.com`;

    const request: HttpRequest = {
      method: HttpMethod.POST,
      url: `${baseUrl}/tasks/${taskId}/time_entries.json`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: auth.api_key,
      },
      body: {
        'time-entry': timeEntryData,
      },
    };
    const response = await httpClient.sendRequest(request);
    return response.body;
  },

  async createTaskInTaskList(auth: TeamworkAuth, tasklistId: string, taskData: Record<string, unknown>): Promise<any> {
    const baseUrl =
      auth.region === 'eu'
        ? `https://${auth.site_name}.eu.teamwork.com`
        : `https://${auth.site_name}.teamwork.com`;

    const request: HttpRequest = {
      method: HttpMethod.POST,
      url: `${baseUrl}/tasklists/${tasklistId}/tasks.json`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: auth.api_key,
      },
      body: {
        'todo-item': taskData,
      },
    };
    const response = await httpClient.sendRequest(request);
    return response.body;
  },

  async createTaskInProject(auth: TeamworkAuth, projectId: string, taskData: Record<string, unknown>): Promise<any> {
    const baseUrl =
      auth.region === 'eu'
        ? `https://${auth.site_name}.eu.teamwork.com`
        : `https://${auth.site_name}.teamwork.com`;

    const request: HttpRequest = {
      method: HttpMethod.POST,
      url: `${baseUrl}/projects/${projectId}/tasks.json`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: auth.api_key,
      },
      body: {
        'todo-item': taskData,
      },
    };
    const response = await httpClient.sendRequest(request);
    return response.body;
  },

  async markTaskComplete(auth: TeamworkAuth, taskId: string): Promise<any> {
    const baseUrl =
      auth.region === 'eu'
        ? `https://${auth.site_name}.eu.teamwork.com`
        : `https://${auth.site_name}.teamwork.com`;

    const request: HttpRequest = {
      method: HttpMethod.PUT,
      url: `${baseUrl}/tasks/${taskId}/complete.json`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: auth.api_key,
      },
    };
    const response = await httpClient.sendRequest(request);
    return response.body;
  },

  async createExpense(auth: TeamworkAuth, expenseData: Record<string, unknown>): Promise<any> {
    const baseUrl =
      auth.region === 'eu'
        ? `https://${auth.site_name}.eu.teamwork.com`
        : `https://${auth.site_name}.teamwork.com`;

    const request: HttpRequest = {
      method: HttpMethod.POST,
      url: `${baseUrl}/expenses.json`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: auth.api_key,
      },
      body: {
        expense: expenseData,
      },
    };
    const response = await httpClient.sendRequest(request);
    return response.body;
  },

  async addPeopleToProject(auth: TeamworkAuth, projectId: string, peopleIds: string[]): Promise<any> {
    const baseUrl =
      auth.region === 'eu'
        ? `https://${auth.site_name}.eu.teamwork.com`
        : `https://${auth.site_name}.teamwork.com`;
    
    const request: HttpRequest = {
      method: HttpMethod.POST,
      url: `${baseUrl}/projects/${projectId}/people.json#merge`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: auth.api_key,
      },
      body: {
        add: {
          'user-ids': peopleIds.join(','),
        },
      },
    };
    const response = await httpClient.sendRequest(request);
    return response.body;
  },

  async updateTask(auth: TeamworkAuth, taskId: string, taskData: Record<string, unknown>): Promise<any> {
    const baseUrl =
      auth.region === 'eu'
        ? `https://${auth.site_name}.eu.teamwork.com`
        : `https://${auth.site_name}.teamwork.com`;

    const request: HttpRequest = {
      method: HttpMethod.PUT,
      url: `${baseUrl}/tasks/${taskId}.json`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: auth.api_key,
      },
      body: {
        'todo-item': taskData,
      },
    };
    const response = await httpClient.sendRequest(request);
    return response.body;
  },

  async findCompanies(auth: TeamworkAuth, searchTerm: string): Promise<any[]> {
    const baseUrl =
      auth.region === 'eu'
        ? `https://${auth.site_name}.eu.teamwork.com`
        : `https://${auth.site_name}.teamwork.com`;

    const request: HttpRequest = {
      method: HttpMethod.GET,
      url: `${baseUrl}/companies.json`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: auth.api_key,
      },
    };
    const response = await httpClient.sendRequest<{ companies: any[] }>(request);
    
    const filteredCompanies = response.body.companies.filter(company => 
      company.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    return filteredCompanies;
  },

  async findMilestones(auth: TeamworkAuth, projectId: string, searchTerm: string): Promise<any[]> {
    const baseUrl =
      auth.region === 'eu'
        ? `https://${auth.site_name}.eu.teamwork.com`
        : `https://${auth.site_name}.teamwork.com`;

    const request: HttpRequest = {
      method: HttpMethod.GET,
      url: `${baseUrl}/projects/${projectId}/milestones.json`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: auth.api_key,
      },
    };
    const response = await httpClient.sendRequest<{ milestones: any[] }>(request);
    
    const foundMilestones = response.body.milestones.filter(milestone => 
      milestone.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    return foundMilestones;
  },

  async getNotebookComments(auth: TeamworkAuth, notebookId: string): Promise<any[]> {
    const baseUrl =
      auth.region === 'eu'
        ? `https://${auth.site_name}.eu.teamwork.com`
        : `https://${auth.site_name}.teamwork.com`;

    const request: HttpRequest = {
      method: HttpMethod.GET,
      url: `${baseUrl}/projects/api/v3/notebooks/${notebookId}/comments.json`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: auth.api_key,
      },
    };
    const response = await httpClient.sendRequest<{ comments: any[] }>(request);
    return response.body.comments;
  },

  async findTasks(auth: TeamworkAuth, queryParams: Record<string, any>): Promise<any[]> {
    const baseUrl =
      auth.region === 'eu'
        ? `https://${auth.site_name}.eu.teamwork.com`
        : `https://${auth.site_name}.teamwork.com`;

    const request: HttpRequest = {
      method: HttpMethod.GET,
      url: `${baseUrl}/tasks.json`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: auth.api_key,
      },
      queryParams: queryParams,
    };
    const response = await httpClient.sendRequest<{ 'todo-items': any[] }>(request);
    return response.body['todo-items'];
  },

  async getComments(auth: TeamworkAuth, queryParams: Record<string, any>): Promise<any[]> {
    const baseUrl =
      auth.region === 'eu'
        ? `https://${auth.site_name}.eu.teamwork.com`
        : `https://${auth.site_name}.teamwork.com`;

    const request: HttpRequest = {
      method: HttpMethod.GET,
      url: `${baseUrl}/projects/api/v3/comments.json`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: auth.api_key,
      },
      queryParams: queryParams,
    };
    const response = await httpClient.sendRequest<{ comments: any[] }>(request);
    return response.body.comments;
  },

  async getExpenses(auth: TeamworkAuth, projectId?: string, updatedAfterDate?: string): Promise<any[]> {
    const baseUrl =
      auth.region === 'eu'
        ? `https://${auth.site_name}.eu.teamwork.com`
        : `https://${auth.site_name}.teamwork.com`;

    const queryParams: Record<string, any> = {};
    if (updatedAfterDate) {
      queryParams['updatedAfterDate'] = updatedAfterDate;
    }

    const url = projectId
      ? `${baseUrl}/projects/${projectId}/expenses.json`
      : `${baseUrl}/expenses.json`;

    const request: HttpRequest = {
      method: HttpMethod.GET,
      url,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: auth.api_key,
      },
      queryParams,
    };
    const response = await httpClient.sendRequest<{ expenses: any[] }>(request);
    return response.body.expenses;
  },

  async getInvoices(auth: TeamworkAuth, projectId?: string, updatedAfterDate?: string): Promise<any[]> {
    const baseUrl =
      auth.region === 'eu'
        ? `https://${auth.site_name}.eu.teamwork.com`
        : `https://${auth.site_name}.teamwork.com`;

    const queryParams: Record<string, any> = {};
    if (updatedAfterDate) {
      queryParams['updatedAfterDate'] = updatedAfterDate.replace(/[-:]/g, '').replace('T', '').substring(0, 14);
    }
    
    const url = projectId
      ? `${baseUrl}/projects/${projectId}/invoices.json`
      : `${baseUrl}/invoices.json`;

    const request: HttpRequest = {
      method: HttpMethod.GET,
      url,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: auth.api_key,
      },
      queryParams,
    };
    const response = await httpClient.sendRequest<{ invoices: any[] }>(request);
    return response.body.invoices;
  },

  async getTasks(auth: TeamworkAuth, projectId?: string, createdAfterDate?: string): Promise<any[]> {
    const baseUrl =
      auth.region === 'eu'
        ? `https://${auth.site_name}.eu.teamwork.com`
        : `https://${auth.site_name}.teamwork.com`;

    const queryParams: Record<string, any> = {
      pageSize: 250,
      sort: 'dateadded',
      sortOrder: 'desc',
    };
    if (createdAfterDate) {
      queryParams['createdAfterDate'] = createdAfterDate.replace(/[-:]/g, '').replace('T', '').substring(0, 14);
    }
    
    const url = projectId
      ? `${baseUrl}/projects/${projectId}/tasks.json`
      : `${baseUrl}/tasks.json`;

    const request: HttpRequest = {
      method: HttpMethod.GET,
      url,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: auth.api_key,
      },
      queryParams,
    };
    const response = await httpClient.sendRequest<{ 'todo-items': any[] }>(request);
    return response.body['todo-items'];
  },

  async getFiles(auth: TeamworkAuth, projectId: string): Promise<any[]> {
    const baseUrl =
      auth.region === 'eu'
        ? `https://${auth.site_name}.eu.teamwork.com`
        : `https://${auth.site_name}.teamwork.com`;

    const request: HttpRequest = {
      method: HttpMethod.GET,
      url: `${baseUrl}/projects/${projectId}/files.json`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: auth.api_key,
      },
    };
    const response = await httpClient.sendRequest<{ project: { files: any[] } }>(request);
    return response.body.project.files;
  },
};