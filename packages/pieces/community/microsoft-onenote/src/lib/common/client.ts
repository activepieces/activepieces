import {
  HttpMethod,
  httpClient,
  HttpRequest,
} from '@activepieces/pieces-common';
import {
  CreateNotebookRequest,
  CreatePageRequest,
  CreateSectionRequest,
  ListNotebooksResponse,
  ListPagesResponse,
  ListSectionsResponse,
  OneNoteNotebook,
  OneNotePage,
  OneNoteSection,
} from './types';

export class MicrosoftOneNoteClient {
  constructor(private accessToken: string) {}

  async listNotebooks(): Promise<ListNotebooksResponse> {
    const request: HttpRequest = {
      method: HttpMethod.GET,
      url: 'https://graph.microsoft.com/v1.0/me/onenote/notebooks',
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
    };
    const res = await httpClient.sendRequest(request);
    if (res.status !== 200) {
      const errorMessage = res.body?.error?.message || res.body?.message || `HTTP ${res.status}`;
      throw new Error(`Failed to list notebooks: ${errorMessage}`);
    }
    return res.body;
  }

  async createNotebook(request: CreateNotebookRequest): Promise<OneNoteNotebook> {
    const httpRequest: HttpRequest = {
      method: HttpMethod.POST,
      url: 'https://graph.microsoft.com/v1.0/me/onenote/notebooks',
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: request,
    };
    const res = await httpClient.sendRequest(httpRequest);
    if (res.status !== 201) {
      const errorMessage = res.body?.error?.message || res.body?.message || `HTTP ${res.status}`;
      throw new Error(`Failed to create notebook: ${errorMessage}`);
    }
    return res.body;
  }

  async listSections(notebookId?: string): Promise<ListSectionsResponse> {
    const endpoint = notebookId
      ? `/me/onenote/notebooks/${notebookId}/sections`
      : '/me/onenote/sections';
    const request: HttpRequest = {
      method: HttpMethod.GET,
      url: `https://graph.microsoft.com/v1.0${endpoint}`,
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
    };
    const res = await httpClient.sendRequest(request);
    if (res.status !== 200) {
      const errorMessage = res.body?.error?.message || res.body?.message || `HTTP ${res.status}`;
      throw new Error(`Failed to list sections: ${errorMessage}`);
    }
    return res.body;
  }

  async createSection(
    notebookId: string,
    request: CreateSectionRequest,
  ): Promise<OneNoteSection> {
    const httpRequest: HttpRequest = {
      method: HttpMethod.POST,
      url: `https://graph.microsoft.com/v1.0/me/onenote/notebooks/${notebookId}/sections`,
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: request,
    };
    const res = await httpClient.sendRequest(httpRequest);
    if (res.status !== 201) {
      const errorMessage = res.body?.error?.message || res.body?.message || `HTTP ${res.status}`;
      throw new Error(`Failed to create section: ${errorMessage}`);
    }
    return res.body;
  }

  async listPages(sectionId: string): Promise<ListPagesResponse> {
    const request: HttpRequest = {
      method: HttpMethod.GET,
      url: `https://graph.microsoft.com/v1.0/me/onenote/sections/${sectionId}/pages`,
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
    };
    const res = await httpClient.sendRequest(request);
    if (res.status !== 200) {
      const errorMessage = res.body?.error?.message || res.body?.message || `HTTP ${res.status}`;
      throw new Error(`Failed to list pages: ${errorMessage}`);
    }
    return res.body;
  }

  async createPage(
    sectionId: string,
    request: CreatePageRequest,
  ): Promise<OneNotePage> {
    // For OneNote, we need to send HTML content directly
    // According to the API docs: https://learn.microsoft.com/en-us/graph/api/section-post-pages?view=graph-rest-1.0&tabs=http
    const htmlContent = this.buildPageHtml(request.title, request.content);
    
    const httpRequest: HttpRequest = {
      method: HttpMethod.POST,
      url: `https://graph.microsoft.com/v1.0/me/onenote/sections/${sectionId}/pages`,
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': 'text/html',
      },
      body: htmlContent,
    };

    const res = await httpClient.sendRequest(httpRequest);
    if (res.status !== 201) {
      const errorMessage = res.body?.error?.message || res.body?.message || `HTTP ${res.status}`;
      throw new Error(`Failed to create page: ${errorMessage}`);
    }
    return res.body;
  }

  async createImagePage(
    sectionId: string,
    title: string,
    imageUrl: string,
  ): Promise<OneNotePage> {
    const htmlContent = this.buildImagePageHtml(title, imageUrl);
    
    const httpRequest: HttpRequest = {
      method: HttpMethod.POST,
      url: `https://graph.microsoft.com/v1.0/me/onenote/sections/${sectionId}/pages`,
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': 'text/html',
      },
      body: htmlContent,
    };

    const res = await httpClient.sendRequest(httpRequest);
    if (res.status !== 201) {
      const errorMessage = res.body?.error?.message || res.body?.message || `HTTP ${res.status}`;
      throw new Error(`Failed to create image page: ${errorMessage}`);
    }
    return res.body;
  }

  async getPage(pageId: string): Promise<OneNotePage> {
    const request: HttpRequest = {
      method: HttpMethod.GET,
      url: `https://graph.microsoft.com/v1.0/me/onenote/pages/${pageId}`,
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
    };
    const res = await httpClient.sendRequest(request);
    if (res.status !== 200) {
      const errorMessage = res.body?.error?.message || res.body?.message || `HTTP ${res.status}`;
      throw new Error(`Failed to get page: ${errorMessage}`);
    }
    return res.body;
  }

  async getPageContent(pageId: string): Promise<string> {
    const request: HttpRequest = {
      method: HttpMethod.GET,
      url: `https://graph.microsoft.com/v1.0/me/onenote/pages/${pageId}/content`,
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Accept': 'text/html',
      },
    };
    const res = await httpClient.sendRequest(request);
    if (res.status !== 200) {
      const errorMessage = res.body?.error?.message || res.body?.message || `HTTP ${res.status}`;
      throw new Error(`Failed to get page content: ${errorMessage}`);
    }
    return res.body;
  }

  async updatePage(
    pageId: string,
    request: { content: string },
  ): Promise<OneNotePage> {
    const htmlContent = this.buildPageHtml(undefined, request.content);
    
    const httpRequest: HttpRequest = {
      method: HttpMethod.PATCH,
      url: `https://graph.microsoft.com/v1.0/me/onenote/pages/${pageId}`,
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': 'text/html',
      },
      body: htmlContent,
    };

    const res = await httpClient.sendRequest(httpRequest);
    if (res.status !== 200) {
      const errorMessage = res.body?.error?.message || res.body?.message || `HTTP ${res.status}`;
      throw new Error(`Failed to update page: ${errorMessage}`);
    }
    return res.body;
  }

  private buildPageHtml(title: string | undefined, content: string): string {
    const titleHtml = title ? `<title>${title}</title>` : '';
    // Following the API documentation format
    return `<!DOCTYPE html>
<html>
  <head>
    ${titleHtml}
    <meta name="created" content="${new Date().toISOString()}" />
  </head>
  <body>
    ${content}
  </body>
</html>`;
  }

  private buildImagePageHtml(title: string, imageUrl: string): string {
    // Following the API documentation format for images
    return `<!DOCTYPE html>
<html>
  <head>
    <title>${title}</title>
    <meta name="created" content="${new Date().toISOString()}" />
  </head>
  <body>
    <img src="${imageUrl}" alt="${title}" style="max-width: 100%; height: auto;" />
  </body>
</html>`;
  }
} 