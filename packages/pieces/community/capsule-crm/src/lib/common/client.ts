import {
  AuthenticationType,
  httpClient,
  HttpMethod,
  HttpRequest,
} from '@activepieces/pieces-common';
import {
  CreateOpportunityParams,
  CreatePartyParams,
  CreateProjectParams,
  Milestone,
  Opportunity,
  Party,
  Project,
  UpdateOpportunityParams,
  UpdatePartyParams,
  Case,
  CreateTaskParams,
  Task,
  User,
  CreateNoteParams,
  Note,
  FindContactParams,
  FindProjectParams,
  FindOpportunityParams,
  Webhook, 
} from './types';

export const capsuleCrmClient = {
  async createContact(auth: string, params: CreatePartyParams): Promise<Party> {
    const partyData: { [key: string]: unknown } = {
      type: params.type,
    };

    if (params.type === 'person') {
      partyData['firstName'] = params.firstName;
      partyData['lastName'] = params.lastName;
    } else {
      partyData['name'] = params.name;
    }

    if (params.email) {
      partyData['emailAddresses'] = [{ address: params.email }];
    }
    if (params.phone) {
      partyData['phoneNumbers'] = [{ number: params.phone }];
    }

    const request: HttpRequest = {
      method: HttpMethod.POST,
      url: 'https://api.capsulecrm.com/api/v2/parties',
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: auth,
      },
      body: {
        party: partyData,
      },
    };

    const response = await httpClient.sendRequest<Party>(request);
    return response.body;
  },

  async searchContacts(auth: string, searchTerm: string): Promise<Party[]> {
    const request: HttpRequest = {
      method: HttpMethod.GET,
      url: `https://api.capsulecrm.com/api/v2/parties/search`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: auth,
      },
      queryParams: {
        q: searchTerm,
      },
    };
    const response = await httpClient.sendRequest<{ parties: Party[] }>(
      request
    );
    return response.body.parties;
  },

  async updateContact(
    auth: string,
    partyId: number,
    params: UpdatePartyParams
  ): Promise<Party> {
    const partyData: { [key: string]: unknown } = {};
    if (params.firstName) partyData['firstName'] = params.firstName;
    if (params.lastName) partyData['lastName'] = params.lastName;
    if (params.name) partyData['name'] = params.name;
    if (params.title) partyData['title'] = params.title;
    if (params.about) partyData['about'] = params.about;
    if (params.email) partyData['emailAddresses'] = [{ address: params.email }];
    if (params.phone) partyData['phoneNumbers'] = [{ number: params.phone }];

    const request: HttpRequest = {
      method: HttpMethod.PUT,
      url: `https://api.capsulecrm.com/api/v2/parties/${partyId}`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: auth,
      },
      body: {
        party: partyData,
      },
    };
    const response = await httpClient.sendRequest<Party>(request);
    return response.body;
  },

  async listMilestones(auth: string): Promise<Milestone[]> {
    const request: HttpRequest = {
      method: HttpMethod.GET,
      url: `https://api.capsulecrm.com/api/v2/opportunities/milestones`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: auth,
      },
    };
    const response = await httpClient.sendRequest<{
      milestones: Milestone[];
    }>(request);
    return response.body.milestones;
  },

  async createOpportunity(
    auth: string,
    params: CreateOpportunityParams
  ): Promise<Opportunity> {
    const opportunityData: { [key: string]: unknown } = {
      party: { id: params.partyId },
      milestone: { id: params.milestoneId },
      name: params.name,
    };

    if (params.description) opportunityData['description'] = params.description;
    if (params.expectedCloseOn)
      opportunityData['expectedCloseOn'] = params.expectedCloseOn;
    if (params.currency && params.amount) {
      opportunityData['value'] = {
        currency: params.currency,
        amount: params.amount,
      };
    }

    const request: HttpRequest = {
      method: HttpMethod.POST,
      url: 'https://api.capsulecrm.com/api/v2/opportunities',
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: auth,
      },
      body: {
        opportunity: opportunityData,
      },
    };

    const response = await httpClient.sendRequest<Opportunity>(request);
    return response.body;
  },

  async listOpportunities(auth: string): Promise<Opportunity[]> {
    const request: HttpRequest = {
      method: HttpMethod.GET,
      url: `https://api.capsulecrm.com/api/v2/opportunities`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: auth,
      },
    };
    const response = await httpClient.sendRequest<{
      opportunities: Opportunity[];
    }>(request);
    return response.body.opportunities;
  },

  async updateOpportunity(
    auth: string,
    opportunityId: number,
    params: UpdateOpportunityParams
  ): Promise<Opportunity> {
    const opportunityData: { [key: string]: unknown } = {};

    if (params.name) opportunityData['name'] = params.name;
    if (params.description) opportunityData['description'] = params.description;
    if (params.milestoneId)
      opportunityData['milestone'] = { id: params.milestoneId };
    if (params.expectedCloseOn)
      opportunityData['expectedCloseOn'] = params.expectedCloseOn;
    if (params.currency && params.amount) {
      opportunityData['value'] = {
        currency: params.currency,
        amount: params.amount,
      };
    }

    const request: HttpRequest = {
      method: HttpMethod.PUT,
      url: `https://api.capsulecrm.com/api/v2/opportunities/${opportunityId}`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: auth,
      },
      body: {
        opportunity: opportunityData,
      },
    };

    const response = await httpClient.sendRequest<Opportunity>(request);
    return response.body;
  },

  async createProject(
    auth: string,
    params: CreateProjectParams
  ): Promise<Project> {
    const projectData: { [key: string]: unknown } = {
      party: { id: params.partyId },
      name: params.name,
    };

    if (params.description) {
      projectData['description'] = params.description;
    }
    if (params.opportunityId) {
      projectData['opportunity'] = { id: params.opportunityId };
    }

    const request: HttpRequest = {
      method: HttpMethod.POST,
      url: 'https://api.capsulecrm.com/api/v2/projects',
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: auth,
      },
      body: {
        project: projectData,
      },
    };

    const response = await httpClient.sendRequest<Project>(request);
    return response.body;
  },

  async listProjects(auth: string): Promise<Project[]> {
    const request: HttpRequest = {
      method: HttpMethod.GET,
      url: `https://api.capsulecrm.com/api/v2/projects`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: auth,
      },
    };
    const response = await httpClient.sendRequest<{ projects: Project[] }>(
      request
    );
    return response.body.projects;
  },

  async listCases(auth: string): Promise<Case[]> {
    const request: HttpRequest = {
      method: HttpMethod.GET,
      url: `https://api.capsulecrm.com/api/v2/kases`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: auth,
      },
    };
    const response = await httpClient.sendRequest<{ kases: Case[] }>(request);
    return response.body.kases;
  },

  async listUsers(auth: string): Promise<User[]> {
    const request: HttpRequest = {
      method: HttpMethod.GET,
      url: `https://api.capsulecrm.com/api/v2/users`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: auth,
      },
    };
    const response = await httpClient.sendRequest<{ users: User[] }>(request);
    return response.body.users;
  },

  async createTask(auth: string, params: CreateTaskParams): Promise<Task> {
    const entryData: { [key: string]: unknown } = {
      type: 'Task',
      description: params.description,
    };

    if (params.partyId) entryData['party'] = { id: params.partyId };
    if (params.opportunityId)
      entryData['opportunity'] = { id: params.opportunityId };
    if (params.caseId) entryData['case'] = { id: params.caseId };
    if (params.projectId) entryData['project'] = { id: params.projectId };
    if (params.ownerId) entryData['owner'] = { id: params.ownerId };
    if (params.dueOn) entryData['dueOn'] = params.dueOn;

    const request: HttpRequest = {
      method: HttpMethod.POST,
      url: 'https://api.capsulecrm.com/api/v2/entries',
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: auth,
      },
      body: {
        entry: entryData,
      },
    };

    const response = await httpClient.sendRequest<Task>(request);
    return response.body;
  },

  async createNote(auth: string, params: CreateNoteParams): Promise<Note> {
    const entryData: { [key: string]: unknown } = {
      type: 'Note',
      content: params.content,
    };

    if (params.partyId) entryData['party'] = { id: params.partyId };
    if (params.opportunityId)
      entryData['opportunity'] = { id: params.opportunityId };
    if (params.caseId) entryData['case'] = { id: params.caseId };
    if (params.projectId) entryData['project'] = { id: params.projectId };

    const request: HttpRequest = {
      method: HttpMethod.POST,
      url: 'https://api.capsulecrm.com/api/v2/entries',
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: auth,
      },
      body: {
        entry: entryData,
      },
    };

    const response = await httpClient.sendRequest<Note>(request);
    return response.body;
  },

  async findContact(auth: string, params: FindContactParams): Promise<Party[]> {
    const queryParams: Record<string, string> = {};

    if (params.email) {
      queryParams['email'] = params.email;
    } else if (params.searchTerm) {
      queryParams['q'] = params.searchTerm;
    }

    const request: HttpRequest = {
      method: HttpMethod.GET,
      url: `https://api.capsulecrm.com/api/v2/parties/search`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: auth,
      },
      queryParams: queryParams,
    };
    const response = await httpClient.sendRequest<{ parties: Party[] }>(
      request
    );
    return response.body.parties;
  },

  async findProject(
    auth: string,
    params: FindProjectParams
  ): Promise<Project[]> {
    const request: HttpRequest = {
      method: HttpMethod.GET,
      url: `https://api.capsulecrm.com/api/v2/kases`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: auth,
      },
      queryParams: {
        q: params.searchTerm,
      },
    };
    const response = await httpClient.sendRequest<{ kases: Project[] }>(
      request
    );
    return response.body.kases;
  },

  async findOpportunity(
    auth: string,
    params: FindOpportunityParams
  ): Promise<Opportunity[]> {
    const request: HttpRequest = {
      method: HttpMethod.GET,
      url: `https://api.capsulecrm.com/api/v2/opportunities/search`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: auth,
      },
      queryParams: {
        q: params.searchTerm,
      },
    };
    const response = await httpClient.sendRequest<{
      opportunities: Opportunity[];
    }>(request);
    return response.body.opportunities;
  },

  async subscribeWebhook(
    auth: string,
    url: string,
    event: string
  ): Promise<Webhook> {
    const request: HttpRequest = {
      method: HttpMethod.POST,
      url: `https://api.capsulecrm.com/api/v2/webhooks`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: auth,
      },
      body: {
        webhook: {
          url: url,
          event: event,
        },
      },
    };
    const response = await httpClient.sendRequest<{ webhook: Webhook }>(
      request
    );
    return response.body.webhook;
  },

  async unsubscribeWebhook(auth: string, webhookId: number): Promise<void> {
    const request: HttpRequest = {
      method: HttpMethod.DELETE,
      url: `https://api.capsulecrm.com/api/v2/webhooks/${webhookId}`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: auth,
      },
    };
    await httpClient.sendRequest(request);
  },
};
