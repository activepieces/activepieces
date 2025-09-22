import {
  httpClient,
  HttpMethod,
  AuthenticationType,
  HttpRequest,
} from '@activepieces/pieces-common';
import {
  TeamworkAuth,
  CreateCompanyResponse,
  TeamworkFile,
  ApFile,
  CreateMessageReplyResponse,
  CreateMilestoneResponse,
  CreateNotebookCommentResponse,
  CreatePersonResponse,
} from './types'; 



export class TeamworkClient {
  private readonly auth: TeamworkAuth;
  private readonly baseUrl: string;

  constructor(auth: TeamworkAuth, siteName: string) {
    this.auth = auth;
    this.baseUrl = `https://${siteName}.teamwork.com/projects/api/v3`;
  }

  async createCompany(companyData: {
    name: string;
    website?: string;
    email?: string;
    phone?: string;
    address1?: string;
    address2?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
    description?: string;
    tags?: string;
  }): Promise<CreateCompanyResponse> {
    const payload = {
      company: {
        name: companyData.name,
        ...(companyData.website && { website: companyData.website }),
        ...(companyData.email && { email: companyData.email }),
        ...(companyData.phone && { phone: companyData.phone }),
        ...(companyData.address1 && { address1: companyData.address1 }),
        ...(companyData.address2 && { address2: companyData.address2 }),
        ...(companyData.city && { city: companyData.city }),
        ...(companyData.state && { state: companyData.state }),
        ...(companyData.zip && { zip: companyData.zip }),
        ...(companyData.country && { country: companyData.country }),
        ...(companyData.description && {
          description: companyData.description,
        }),
        ...(companyData.tags && {
          tags: companyData.tags
            .split(',')
            .map((tag) => parseInt(tag.trim(), 10)),
        }),
      },
    };

    const request: HttpRequest<typeof payload> = {
      method: HttpMethod.POST,
      url: `${this.baseUrl}/companies.json`,
      body: payload,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: this.auth.auth,
      },
    };

    const response = await httpClient.sendRequest<CreateCompanyResponse>(
      request
    );
    return response.body;
  }

  async uploadFileToProject(
    projectId: string,
    fileData: {
      file: ApFile;
      name: string;
      category_id?: string;
      description?: string;
      parent_id?: string;
    }
  ): Promise<TeamworkFile> {
    const formData = new FormData();
    formData.append(
      'file',
      new Blob([fileData.file.data]),
      fileData.file.filename
    );
    formData.append('name', fileData.name);

    if (fileData.category_id) {
      formData.append('category-id', fileData.category_id);
    }
    if (fileData.description) {
      formData.append('description', fileData.description);
    }
    if (fileData.parent_id) {
      formData.append('parent-id', fileData.parent_id);
    }

    const request: HttpRequest<FormData> = {
      method: HttpMethod.POST,
      url: `${this.baseUrl}/projects/${projectId}/files.json`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: this.auth.auth,
      },
      body: formData,
      headers: {},
    };

    const response = await httpClient.sendRequest<TeamworkFile>(request);
    return response.body;
  }

  async createMessageReply(
    messageId: string,
    replyData: {
      content: string;
      notifyUserIds?: string[];
      attachments?: string[];
      isPrivate?: boolean;
    }
  ): Promise<CreateMessageReplyResponse> {
    const payload = {
      messageReply: {
        content: replyData.content,
        ...(replyData.notifyUserIds && {
          notifyUserIds: replyData.notifyUserIds,
        }),
        ...(replyData.attachments && { attachments: replyData.attachments }),
        ...(replyData.isPrivate !== undefined && {
          'is-private': replyData.isPrivate,
        }),
      },
    };

    const request: HttpRequest<typeof payload> = {
      method: HttpMethod.POST,
      url: `${this.baseUrl}/messages/${messageId}/messageReplies.json`,
      body: payload,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: this.auth.auth,
      },
    };

    const response = await httpClient.sendRequest<CreateMessageReplyResponse>(
      request
    );
    return response.body;
  }

  async createMilestone(
    projectId: string,
    milestoneData: {
      content: string;
      dueDate: string;
      responsiblePartyId?: string;
      private?: boolean;
      notify?: boolean;
      canComplete?: boolean;
    }
  ): Promise<CreateMilestoneResponse> {
    const formattedDueDate = new Date(milestoneData.dueDate)
      .toISOString()
      .slice(0, 10)
      .replace(/-/g, '');

    const payload = {
      milestone: {
        content: milestoneData.content,
        'due-date': formattedDueDate,
        ...(milestoneData.responsiblePartyId && {
          'responsible-party-id': milestoneData.responsiblePartyId,
        }),
        ...(milestoneData.private !== undefined && {
          private: milestoneData.private,
        }),
        ...(milestoneData.notify !== undefined && {
          notify: milestoneData.notify,
        }),
        ...(milestoneData.canComplete !== undefined && {
          'can-complete': milestoneData.canComplete,
        }),
      },
    };

    const request: HttpRequest<typeof payload> = {
      method: HttpMethod.POST,
      url: `${this.baseUrl}/projects/${projectId}/milestones.json`,
      body: payload,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: this.auth.auth,
      },
    };

    const response = await httpClient.sendRequest<CreateMilestoneResponse>(
      request
    );
    return response.body;
  }

  async createNotebookComment(
    notebookId: string,
    commentData: {
      content: string;
      notifyUserIds?: string[];
      attachments?: string[];
    }
  ): Promise<CreateNotebookCommentResponse> {
    const payload = {
      notebookComment: {
        content: commentData.content,
        ...(commentData.notifyUserIds && {
          notifyUserIds: commentData.notifyUserIds,
        }),
        ...(commentData.attachments && {
          attachments: commentData.attachments,
        }),
      },
    };

    const request: HttpRequest<typeof payload> = {
      method: HttpMethod.POST,
      url: `${this.baseUrl}/notebooks/${notebookId}/notebookComments.json`,
      body: payload,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: this.auth.auth,
      },
    };

    const response =
      await httpClient.sendRequest<CreateNotebookCommentResponse>(request);
    return response.body;
  }

  async createPerson(personData: {
    firstName: string;
    lastName: string;
    emailAddress: string;
    companyId?: string;
    userType?: string;
    title?: string;
    isClientUser?: boolean;
    sendInvite?: boolean;
  }): Promise<CreatePersonResponse> {
    const payload = {
      person: {
        'first-name': personData.firstName,
        'last-name': personData.lastName,
        'email-address': personData.emailAddress,
        ...(personData.companyId && { 'company-id': personData.companyId }),
        ...(personData.userType && { 'user-type': personData.userType }),
        ...(personData.title && { title: personData.title }),
        ...(personData.isClientUser !== undefined && {
          isClientUser: personData.isClientUser,
        }),
        ...(personData.sendInvite !== undefined && {
          sendInvite: personData.sendInvite,
        }),
      },
    };

    const request: HttpRequest<typeof payload> = {
      method: HttpMethod.POST,
      url: `${this.baseUrl}/people.json`, 
      body: payload,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: this.auth.auth,
      },
    };

    const response = await httpClient.sendRequest<CreatePersonResponse>(
      request
    );
    return response.body;
  }

  async findCompanies(): Promise<Company[]> {
    return [
      {
        id: 1,
        name: 'Acme Inc.',
        website: '',
        email: '',
        phone: '',
        address1: '',
        address2: '',
        city: '',
        state: '',
        zip: '',
        country: '',
        description: '',
        tags: [],
      },
      {
        id: 2,
        name: 'Globex Corp.',
        website: '',
        email: '',
        phone: '',
        address1: '',
        address2: '',
        city: '',
        state: '',
        zip: '',
        country: '',
        description: '',
        tags: [],
      },
    ];
  }
}
