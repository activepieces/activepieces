import {
  HttpMessageBody,
  HttpMethod,
  QueryParams,
  httpClient,
} from '@activepieces/pieces-common';
import { vboutCommon } from '.';
import {
  CampaignCreateRequest,
  ContactCreateRequest,
  ContactList,
  ContactUpdateRequest,
  EmailListCreateRequest,
  SocialMediaChannelListResponse,
  SocialMediaPostCreateRequest,
  TagCreateRequest,
  VboutResponseBody,
} from './models';

function emptyValueFilter(
  accessor: (key: string) => any
): (key: string) => boolean {
  return (key: string) => {
    const val = accessor(key);
    return (
      val !== null &&
      val !== undefined &&
      (typeof val != 'string' || val.length > 0)
    );
  };
}

export function prepareQuery(request?: Record<string, any>): QueryParams {
  const params: QueryParams = {};
  if (!request) return params;
  Object.keys(request)
    .filter(emptyValueFilter((k) => request[k]))
    .forEach((k: string) => {
      params[k] = (request as Record<string, any>)[k].toString();
    });
  return params;
}
export class VboutClient {
  constructor(private apiKey: string) {}

  async makeRequest<T extends HttpMessageBody>(
    method: HttpMethod,
    url: string,
    query?: QueryParams,
    body?: object
  ): Promise<T> {
    const res = await httpClient.sendRequest<T>({
      method,
      url: vboutCommon.baseUrl + url,
      queryParams: { key: this.apiKey, ...query },
      body,
    });
    return res.body;
  }

  async validateAuth() {
    return await this.makeRequest(HttpMethod.GET, '/app/me');
  }

  async listEmailLists() {
    return (
      await this.makeRequest<
        VboutResponseBody<{
          lists: {
            count: number;
            items: ContactList[];
          };
        }>
      >(HttpMethod.GET, '/emailmarketing/getlists')
    ).response.data;
  }

  async getContactByEmail(email: string, listId?: string) {
    return await this.makeRequest<
      VboutResponseBody<{
        contact: {
          id: string;
          email: string;
          listid: string;
          list_name: string;
          [key: string]: any;
        }[];
      }>
    >(
      HttpMethod.GET,
      '/emailmarketing/getcontactbyemail',
      prepareQuery({ email: email, listid: listId })
    );
  }

  async getEmailList(listId: string) {
    return await this.makeRequest<VboutResponseBody<{ list: ContactList }>>(
      HttpMethod.GET,
      '/emailmarketing/getlist',
      prepareQuery({ id: listId })
    );
  }
  async createEmailList(request: EmailListCreateRequest) {
    return await this.makeRequest(
      HttpMethod.POST,
      '/emailMarketing/AddList',
      undefined,
      request
    );
  }
  async addContact(request: ContactCreateRequest) {
    return await this.makeRequest(
      HttpMethod.POST,
      '/emailMarketing/AddContact',
      undefined,
      request
    );
  }
  async updateContact(request: ContactUpdateRequest) {
    return await this.makeRequest(
      HttpMethod.POST,
      '/emailMarketing/EditContact',
      undefined,
      request
    );
  }
  async addTagToContact(request: TagCreateRequest) {
    return await this.makeRequest(
      HttpMethod.POST,
      '/emailMarketing/AddTag',
      undefined,
      request
    );
  }
  async removeTagFromContact(email: string, tagname: string) {
    return await this.makeRequest(
      HttpMethod.DELETE,
      '/emailMarketing/RemoveTag',
      prepareQuery({
        email,
        tagname,
      })
    );
  }

  async addCampaign(request: CampaignCreateRequest) {
    return await this.makeRequest(
      HttpMethod.POST,
      '/emailMarketing/AddCampaign',
      undefined,
      request
    );
  }
  async listSocialMediaChannels() {
    return (
      await this.makeRequest<
        VboutResponseBody<{ channels: SocialMediaChannelListResponse }>
      >(HttpMethod.GET, '/socialMedia/Channels')
    ).response.data;
  }

  async createSocialMediaPost(request: SocialMediaPostCreateRequest) {
    return await this.makeRequest(
      HttpMethod.POST,
      '/socialMedia/AddPost',
      undefined,
      request
    );
  }
}
