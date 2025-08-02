import {
  httpClient,
  HttpMethod,
  HttpRequest,
  HttpMessageBody,
  QueryParams,
  AuthenticationType
} from '@activepieces/pieces-common';

const BASE_URL = 'https://api.respond.io/v2';

export interface RespondIoApiCallParams {
  token: string;
  method: HttpMethod;
  endpoint: string;
  query?: QueryParams;
  body?: any;
}

export async function respondIoApiCall<T extends HttpMessageBody>({
  token,
  method,
  endpoint,
  query,
  body
}: RespondIoApiCallParams): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;

  const request: HttpRequest = {
    method,
    url,
    queryParams: query,
    body,
    authentication: {
      type: AuthenticationType.BEARER_TOKEN,
      token: token
    },
    headers: {
      'Content-Type': 'application/json'
    }
  };

  try {
    const response = await httpClient.sendRequest<T>(request);
    return response.body;
  } catch (error: any) {
    // Handle Respond.io-specific errors
    if (error.response?.status === 401) {
      throw new Error('Authentication failed. Please check your API Access Token.');
    } else if (error.response?.status === 403) {
      throw new Error('Access forbidden. Please check your permissions.');
    } else if (error.response?.status === 404) {
      throw new Error('Resource not found.');
    } else if (error.response?.status === 429) {
      throw new Error('Rate limit exceeded. Please try again later.');
    } else if (error.response?.status >= 500) {
      throw new Error('Respond.io server error. Please try again later.');
    }
    
    // Return the original error message if available
    const errorMessage = error.response?.body?.message || error.message || 'An unknown error occurred';
    throw new Error(errorMessage);
  }
}

export class RespondIoClient {
  constructor(private token: string) {}

  async makeRequest<T extends HttpMessageBody>(
    method: HttpMethod,
    endpoint: string,
    query?: QueryParams,
    body?: any
  ): Promise<T> {
    return respondIoApiCall<T>({
      token: this.token,
      method,
      endpoint,
      query,
      body
    });
  }

  // Contacts
  async getContacts(query?: QueryParams) {
    return this.makeRequest(HttpMethod.GET, '/contact', query);
  }

  async getContact(contactId: string) {
    return this.makeRequest(HttpMethod.GET, `/contact/${contactId}`);
  }

  async createContact(contactData: any) {
    return this.makeRequest(HttpMethod.POST, '/contact', undefined, contactData);
  }

  async updateContact(contactId: string, contactData: any) {
    return this.makeRequest(HttpMethod.PUT, `/contact/${contactId}`, undefined, contactData);
  }

  async deleteContact(contactId: string) {
    return this.makeRequest(HttpMethod.DELETE, `/contact/${contactId}`);
  }

  // Contact Tags
  async addTagToContact(contactId: string, tagData: any) {
    return this.makeRequest(HttpMethod.POST, `/contact/${contactId}/tag`, undefined, tagData);
  }

  async removeTagFromContact(contactId: string, tagId: string) {
    return this.makeRequest(HttpMethod.DELETE, `/contact/${contactId}/tag/${tagId}`);
  }

  // Conversations
  async getConversations(query?: QueryParams) {
    return this.makeRequest(HttpMethod.GET, '/conversation', query);
  }

  async getConversation(conversationId: string) {
    return this.makeRequest(HttpMethod.GET, `/conversation/${conversationId}`);
  }

  async assignConversation(conversationId: string, assignmentData: any) {
    return this.makeRequest(HttpMethod.PUT, `/conversation/${conversationId}/assign`, undefined, assignmentData);
  }

  async unassignConversation(conversationId: string) {
    return this.makeRequest(HttpMethod.PUT, `/conversation/${conversationId}/unassign`);
  }

  async openConversation(conversationId: string) {
    return this.makeRequest(HttpMethod.PUT, `/conversation/${conversationId}/open`);
  }

  async closeConversation(conversationId: string) {
    return this.makeRequest(HttpMethod.PUT, `/conversation/${conversationId}/close`);
  }

  // Comments
  async addCommentToConversation(conversationId: string, commentData: any) {
    return this.makeRequest(HttpMethod.POST, `/conversation/${conversationId}/comment`, undefined, commentData);
  }

  // Messages
  async getMessages(conversationId: string, query?: QueryParams) {
    return this.makeRequest(HttpMethod.GET, `/conversation/${conversationId}/message`, query);
  }

  async sendMessage(conversationId: string, messageData: any) {
    return this.makeRequest(HttpMethod.POST, `/conversation/${conversationId}/message`, undefined, messageData);
  }

  // Search
  async searchContacts(searchParams: any) {
    return this.makeRequest(HttpMethod.GET, '/contact', searchParams);
  }
}
