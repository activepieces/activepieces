import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { PieceAuth, Property } from '@activepieces/pieces-framework';
import { OAuth2GrantType } from '@activepieces/shared';
import * as properties from './properties';
import * as schemas from './schemas';
import {
  AddContactToMailingListParams,
  AddTagToContactParams,
  AddUpdateContactParams,
  AuthorizationParams,
  CloneCampaignParams,
  CreateCampaignParams,
  CreateCampaignResponse,
  CreateTagParams,
  ListCampaignParams,
  ListCampaignResponse,
  ListContactsParams,
  ListContactsResponse,
  ListMailingListsParams,
  ListMailingListsResponse,
  ListTagsResponse,
  ListTopicsResponse,
  RemoveTagParams,
  SendCampaignParams,
  UnsubscribeContactParams,
} from './types';

export const zohoCampaignsAuth = PieceAuth.OAuth2({
  props: {
    location: Property.StaticDropdown({
      displayName: 'Data Center',
      description: 'The data center location of your Zoho Campaigns account',
      required: true,
      options: {
        options: [
          {
            label: 'zoho.com (United States)',
            value: 'zoho.com',
          },
          {
            label: 'zoho.eu (Europe)',
            value: 'zoho.eu',
          },
          {
            label: 'zoho.in (India)',
            value: 'zoho.in',
          },
          {
            label: 'zoho.com.au (Australia)',
            value: 'zoho.com.au',
          },
          {
            label: 'zoho.jp (Japan)',
            value: 'zoho.jp',
          },
          {
            label: 'zoho.com.cn (China)',
            value: 'zoho.com.cn',
          },
        ],
      },
    }),
  },
  description: 'Connect your Zoho Campaigns account using OAuth2',
  grantType: OAuth2GrantType.AUTHORIZATION_CODE,
  required: true,
  authUrl: 'https://accounts.{location}/oauth/v2/auth',
  tokenUrl: 'https://accounts.{location}/oauth/v2/token',
  scope: ['ZohoCampaigns.campaign.ALL', 'ZohoCampaigns.contact.ALL'],
});

export const zohoCampaignsCommon = {
  baseUrl: (location = 'zoho.com') => {
    return `https://campaigns.${location}/api/v1.1`;
  },
  endpoints: {
    createCampaign: '/createCampaign',
    createTag: '/tag/add',
    cloneCampaign: '/json/clonecampaign',
    sendCampaign: '/sendcampaign',
    addUpdateContact: '/json/listsubscribe',
    addTagToContact: '/tag/associate',
    removeTag: '/tag/deassociate',
    unsubscribeContact: '/json/listunsubscribe',
    addContactToMailingList: '/addlistsubscribersinbulk',
    listContacts: '/getlistsubscribers',
    listCampaigns: '/recentcampaigns',
    listMailingLists: '/getmailinglists',
    listTopics: '/topics',
    listTags: '/tag/getalltags',
  },
  baseHeaders: (accessToken: string) => {
    return {
      Authorization: `Zoho-oauthtoken ${accessToken}`,
      'Content-Type': 'application/json',
    };
  },
  baseParams: {
    resfmt: 'JSON',
  },

  // Properties
  createCampaignProperties: properties.createCampaign,
  cloneCampaignProperties: properties.cloneCampaign,
  sendCampaignProperties: properties.sendCampaign,
  addUpdateContactProperties: properties.addUpdateContact,
  addTagToContactProperties: properties.addTagToContact,
  removeTagProperties: properties.removeTag,
  unsubscribeContactProperties: properties.unsubscribeContact,
  addContactToMailingListProperties: properties.addContactToMailingList,
  findContactProperties: properties.findContact,
  findCampaignProperties: properties.findCampaign,
  newContactProperties: properties.newContact,
  unsubscribeProperties: properties.unsubscribe,

  // Schemas
  createCampaignSchema: schemas.createCampaign,
  cloneCampaignSchema: schemas.cloneCampaign,
  sendCampaignSchema: schemas.sendCampaign,
  addUpdateContactSchema: schemas.addUpdateContact,
  addTagToContactSchema: schemas.addTagToContact,
  removeTagSchema: schemas.removeTag,
  unsubscribeContactSchema: schemas.unsubscribeContact,
  addContactToMailingListSchema: schemas.addContactToMailingList,
  findContactSchema: schemas.findContact,
  findCampaignSchema: schemas.findCampaign,

  // Methods
  createCampaign: async ({
    accessToken,
    location = 'zoho.com',
    ...campaignParams
  }: CreateCampaignParams & { location?: string }) => {
    const {
      list_details: listDetails,
      topicId,
      ...restParams
    } = campaignParams;

    const list_details = JSON.stringify(listDetails);
    const body = new URLSearchParams({
      resfmt: 'json',
      list_details,
      ...restParams,
      ...(topicId && { topicId }),
    }).toString();
    const response = await httpClient.sendRequest<CreateCampaignResponse>({
      method: HttpMethod.POST,
      url: `${zohoCampaignsCommon.baseUrl(location)}${zohoCampaignsCommon.endpoints.createCampaign}`,
      headers: {
        ...zohoCampaignsCommon.baseHeaders(accessToken),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    });
    return response.body;
  },
  createTag: async ({ accessToken, location = 'zoho.com', tagName }: CreateTagParams & { location?: string }) => {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${zohoCampaignsCommon.baseUrl(location)}${zohoCampaignsCommon.endpoints.createTag}`,
      headers: zohoCampaignsCommon.baseHeaders(accessToken),
      queryParams: {
        ...zohoCampaignsCommon.baseParams,
        tagName,
      },
    });
    return response.body;
  },
  cloneCampaign: async ({ accessToken, location = 'zoho.com', campaigninfo }: CloneCampaignParams & { location?: string }) => {
    const strCampaignInfo = JSON.stringify(campaigninfo);
    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${zohoCampaignsCommon.baseUrl(location)}${zohoCampaignsCommon.endpoints.cloneCampaign}`,
      headers: zohoCampaignsCommon.baseHeaders(accessToken),
      queryParams: {
        ...zohoCampaignsCommon.baseParams,
        campaigninfo: strCampaignInfo,
      },
    });
    return response.body;
  },
  sendCampaign: async ({ accessToken, location = 'zoho.com', campaignkey }: SendCampaignParams & { location?: string }) => {
    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${zohoCampaignsCommon.baseUrl(location)}${zohoCampaignsCommon.endpoints.sendCampaign}`,
      headers: {
        ...zohoCampaignsCommon.baseHeaders(accessToken),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      queryParams: {
        ...zohoCampaignsCommon.baseParams,
        campaignkey,
      },
    });
    return response.body;
  },
  addUpdateContact: async ({
    accessToken,
    location = 'zoho.com',
    ...contactParams
  }: AddUpdateContactParams & { location?: string }) => {
    const {
      listkey,
      contactinfo: contactInfoObj,
      source,
      topic_id,
    } = contactParams;
    const body = new URLSearchParams({
      ...zohoCampaignsCommon.baseParams,
      listkey,
      ...(source && { source }),
      ...(topic_id && { topic_id }),
      contactinfo: JSON.stringify(contactInfoObj),
    }).toString();
    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${zohoCampaignsCommon.baseUrl(location)}${zohoCampaignsCommon.endpoints.addUpdateContact}`,
      headers: {
        ...zohoCampaignsCommon.baseHeaders(accessToken),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    });

    return response.body;
  },
  addTagToContact: async ({
    accessToken,
    location = 'zoho.com',
    ...tagParams
  }: AddTagToContactParams & { location?: string }) => {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${zohoCampaignsCommon.baseUrl(location)}${zohoCampaignsCommon.endpoints.addTagToContact}`,
      headers: zohoCampaignsCommon.baseHeaders(accessToken),
      queryParams: {
        ...zohoCampaignsCommon.baseParams,
        ...tagParams,
      },
    });
    return response.body;
  },
  removeTag: async ({ accessToken, location = 'zoho.com', ...tagParams }: RemoveTagParams & { location?: string }) => {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${zohoCampaignsCommon.baseUrl(location)}${zohoCampaignsCommon.endpoints.removeTag}`,
      headers: zohoCampaignsCommon.baseHeaders(accessToken),
      queryParams: {
        ...zohoCampaignsCommon.baseParams,
        ...tagParams,
      },
    });
    return response.body;
  },
  unsubscribeContact: async ({
    accessToken,
    location = 'zoho.com',
    ...unsubscribeParams
  }: UnsubscribeContactParams & { location?: string }) => {
    const {
      contactinfo: contactInfoObj,
      listkey,
      topic_id,
    } = unsubscribeParams;
    const body = new URLSearchParams({
      ...zohoCampaignsCommon.baseParams,
      listkey,
      ...(topic_id && { topic_id }),
      contactinfo: JSON.stringify(contactInfoObj),
    }).toString();
    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${zohoCampaignsCommon.baseUrl(location)}${zohoCampaignsCommon.endpoints.unsubscribeContact}`,
      headers: {
        ...zohoCampaignsCommon.baseHeaders(accessToken),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    });
    return response.body;
  },
  addContactToMailingList: async ({
    accessToken,
    location = 'zoho.com',
    ...mailingListParams
  }: AddContactToMailingListParams & { location?: string }) => {
    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${zohoCampaignsCommon.baseUrl(location)}${zohoCampaignsCommon.endpoints.addContactToMailingList}`,
      headers: zohoCampaignsCommon.baseHeaders(accessToken),
      queryParams: {
        ...zohoCampaignsCommon.baseParams,
        ...mailingListParams,
      },
    });
    return response.body;
  },
  listContacts: async ({
    accessToken,
    location = 'zoho.com',
    listkey,
    ...rest
  }: ListContactsParams & { location?: string }) => {
    const { fromindex, range, ...otherParams } = rest;
    const strFromIndex =
      typeof fromindex === 'number' ? String(fromindex) : undefined;
    const strRange = typeof range === 'number' ? String(range) : undefined;
    const queryParams = {
      ...zohoCampaignsCommon.baseParams,
      listkey,
      ...(fromindex && { fromindex: strFromIndex }),
      ...(range && { range: strRange }),
      ...otherParams,
    };
    const response = await httpClient.sendRequest<ListContactsResponse>({
      method: HttpMethod.GET,
      url: `${zohoCampaignsCommon.baseUrl(location)}${zohoCampaignsCommon.endpoints.listContacts}`,
      headers: zohoCampaignsCommon.baseHeaders(accessToken),
      queryParams,
    });
    return response.body.list_of_details;
  },
  listCampaigns: async ({
    accessToken,
    location = 'zoho.com',
    ...filterParams
  }: ListCampaignParams & { location?: string }) => {
    const { fromindex, range, ...otherParams } = filterParams;
    const strFromIndex =
      typeof fromindex === 'number' ? String(fromindex) : undefined;
    const strRange = typeof range === 'number' ? String(range) : undefined;
    const queryParams = {
      ...zohoCampaignsCommon.baseParams,
      ...(fromindex && { fromindex: strFromIndex }),
      ...(range && { range: strRange }),
      ...otherParams,
    };
    const response = await httpClient.sendRequest<ListCampaignResponse>({
      method: HttpMethod.GET,
      url: `${zohoCampaignsCommon.baseUrl(location)}${zohoCampaignsCommon.endpoints.listCampaigns}`,
      headers: zohoCampaignsCommon.baseHeaders(accessToken),
      queryParams,
    });
    return response.body.recent_campaigns;
  },
  listMailingLists: async ({
    accessToken,
    location = 'zoho.com',
    ...filterParams
  }: ListMailingListsParams & { location?: string }) => {
    const { fromindex, range, ...otherParams } = filterParams;
    const strFromIndex =
      typeof fromindex === 'number' ? String(fromindex) : undefined;
    const strRange = typeof range === 'number' ? String(range) : undefined;
    const queryParams = {
      ...zohoCampaignsCommon.baseParams,
      ...(fromindex && { fromindex: strFromIndex }),
      ...(range && { range: strRange }),
      ...otherParams,
    };
    const response = await httpClient.sendRequest<ListMailingListsResponse>({
      method: HttpMethod.GET,
      url: `${zohoCampaignsCommon.baseUrl(location)}${zohoCampaignsCommon.endpoints.listMailingLists}`,
      headers: zohoCampaignsCommon.baseHeaders(accessToken),
      queryParams,
    });
    return response.body.list_of_details;
  },
  listTopics: async ({ accessToken, location = 'zoho.com' }: AuthorizationParams & { location?: string }) => {
    const response = await httpClient.sendRequest<ListTopicsResponse>({
      method: HttpMethod.GET,
      url: `${zohoCampaignsCommon.baseUrl(location)}${zohoCampaignsCommon.endpoints.listTopics}`,
      headers: zohoCampaignsCommon.baseHeaders(accessToken),
      queryParams: {
        ...zohoCampaignsCommon.baseParams,
      },
    });
    return response.body.topicDetails;
  },
  listTags: async ({ accessToken, location = 'zoho.com' }: AuthorizationParams & { location?: string }) => {
    const response = await httpClient.sendRequest<ListTagsResponse>({
      method: HttpMethod.GET,
      url: `${zohoCampaignsCommon.baseUrl(location)}${zohoCampaignsCommon.endpoints.listTags}`,
      headers: zohoCampaignsCommon.baseHeaders(accessToken),
      queryParams: {
        ...zohoCampaignsCommon.baseParams,
      },
    });
    return response.body.tags;
  },
};
