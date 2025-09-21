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
    const isSearch = searchTerm && searchTerm.length > 0;
    const url = isSearch
      ? `https://api.capsulecrm.com/api/v2/parties/search`
      : `https://api.capsulecrm.com/api/v2/parties`;

    const queryParams: Record<string, string> = {};

    if (isSearch) {
      queryParams['q'] = searchTerm;
    }

    const request: HttpRequest = {
      method: HttpMethod.GET,
      url: url,
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
      url: `https://api.capsulecrm.com/api/v2/milestones`,
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

  async getOpportunity(
    auth: string,
    opportunityId: number
  ): Promise<Opportunity | null> {
    try {
      const request: HttpRequest = {
        method: HttpMethod.GET,
        url: `https://api.capsulecrm.com/api/v2/opportunities/${opportunityId}`,
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: auth,
        },
      };
      const response = await httpClient.sendRequest<{
        opportunity: Opportunity;
      }>(request);
      return response.body.opportunity;
    } catch (e) {
      return null;
    }
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
      url: 'https://api.capsulecrm.com/api/v2/kases',
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: auth,
      },
      body: {
        kase: projectData,
      },
    };
    const response = await httpClient.sendRequest<Project>(request);
    return response.body;
  },

  async listProjects(auth: string): Promise<Project[]> {
    const request: HttpRequest = {
      method: HttpMethod.GET,
      url: `https://api.capsulecrm.com/api/v2/kases`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: auth,
      },
    };
    const response = await httpClient.sendRequest<{ kases: Project[] }>(
      request
    );
    return response.body.kases;
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
    const taskData: { [key: string]: unknown } = {
      description: params.description,
    };

    if (params.partyId) {
      taskData['party'] = { id: params.partyId };
    }
    if (params.opportunityId) {
      taskData['opportunity'] = { id: params.opportunityId };
    }
    if (params.projectId) {
      taskData['kase'] = { id: params.projectId };
    }
    if (params.caseId) {
      taskData['kase'] = { id: params.caseId };
    }

    if (params.ownerId) {
      taskData['owner'] = { id: params.ownerId };
    }
    if (params.dueOn) {
      taskData['dueOn'] = params.dueOn;
    }

    const request: HttpRequest = {
      method: HttpMethod.POST,
      url: 'https://api.capsulecrm.com/api/v2/tasks',
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: auth,
      },
      body: {
        task: taskData,
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

  async getContact(auth: string, contactId: number): Promise<Party | null> {
    try {
      const request: HttpRequest = {
        method: HttpMethod.GET,
        url: `https://api.capsulecrm.com/api/v2/parties/${contactId}`,
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: auth,
        },
      };
      const response = await httpClient.sendRequest<{ party: Party }>(request);
      return response.body.party;
    } catch (e) {
      return null;
    }
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

  async getProject(auth: string, projectId: number): Promise<Project | null> {
    try {
      const request: HttpRequest = {
        method: HttpMethod.GET,
        url: `https://api.capsulecrm.com/api/v2/kases/${projectId}`,
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: auth,
        },
      };
      const response = await httpClient.sendRequest<{ kase: Project }>(request);
      return response.body.kase;
    } catch (e) {
      return null;
    }
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
