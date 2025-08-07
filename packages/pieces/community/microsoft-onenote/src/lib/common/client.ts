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
      throw new Error(`Failed to list notebooks: ${res.status}`);
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
      throw new Error(`Failed to create notebook: ${res.status}`);
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
      throw new Error(`Failed to list sections: ${res.status}`);
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
      throw new Error(`Failed to create section: ${res.status}`);
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
      throw new Error(`Failed to list pages: ${res.status}`);
    }
    return res.body;
  }

  async createPage(
    sectionId: string,
    request: CreatePageRequest,
  ): Promise<OneNotePage> {
    // For OneNote, we need to send HTML content directly
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
      throw new Error(`Failed to create page: ${res.status}`);
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
      throw new Error(`Failed to create image page: ${res.status}`);
    }
    return res.body;
  }

  private buildPageHtml(title: string | undefined, content: string): string {
    const titleHtml = title ? `<title>${title}</title>` : '';
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