import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { PieceAuth } from '@activepieces/pieces-framework';
import { OAuth2GrantType } from '@activepieces/shared';
import * as properties from './properties';
import * as schemas from './schemas';
import {
  AddContactToMailingListParams,
  AddTagToContactParams,
  AddUpdateContactParams,
  CloneCampaignParams,
  CreateCampaignParams,
  GetCampaignParams,
  ListCampaignParams,
  ListContactsParams,
  RemoveTagParams,
  SendCampaignParams,
  UnsubscribeContactParams,
} from './types';

export const zohoCampaignsAuth = PieceAuth.OAuth2({
  description: 'Connect your Zoho Campaigns account using OAuth2',
  grantType: OAuth2GrantType.AUTHORIZATION_CODE,
  required: true,
  authUrl: 'https://accounts.zoho.com/oauth/v2/auth',
  tokenUrl: 'https://accounts.zoho.com/oauth/v2/token',
  scope: [
    'ZohoCampaigns.campaign.READ',
    'ZohoCampaigns.campaign.CREATE-UPDATE',
    'ZohoCampaigns.contact.READ',
    'ZohoCampaigns.contact.CREATE-UPDATE',
  ],
});

export const zohoCampaignsCommon = {
  baseUrl: 'https://campaigns.zoho.com/api/v1.1',
  endpoints: {
    createCampaign: '/createCampaign',
    cloneCampaign: '/json/clonecampaign',
    sendCampaign: '/sendcampaign',
    addUpdateContact: '/json/listsubscribe',
    addTagToContact: '/tag/associate',
    removeTag: '/tag/deassociate',
    unsubscribeContact: '/json/listunsubscribe',
    addContactToMailingList: '/addlistsubscribersinbulk',
    listContacts: '/getlistsubscribers',
    listCampaign: '/getmailinglists',
    listTopics: '/topics',
    getCampaign: '/getcampaigndetails'
  },
  baseHeaders: (accessToken: string) => {
    return {
      Authorization: `Zoho-oauthtoken ${accessToken}`,
      'Content-Type': 'application/json',
    };
  },
  baseParams: {
    restfmt: 'json',
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
    ...campaignParams
  }: CreateCampaignParams) => {
    const list_details = JSON.stringify(campaignParams.list_details);
    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${zohoCampaignsCommon.baseUrl}${zohoCampaignsCommon.endpoints.createCampaign}`,
      headers: zohoCampaignsCommon.baseHeaders(accessToken),
      queryParams: {
        ...zohoCampaignsCommon.baseParams,
        ...campaignParams,
        list_details,
      },
    });
    return response.body;
  },
  cloneCampaign: async ({ accessToken, campaigninfo }: CloneCampaignParams) => {
    const strCampaignInfo = JSON.stringify(campaigninfo);
    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${zohoCampaignsCommon.baseUrl}${zohoCampaignsCommon.endpoints.cloneCampaign}`,
      headers: zohoCampaignsCommon.baseHeaders(accessToken),
      queryParams: {
        ...zohoCampaignsCommon.baseParams,
        campaigninfo: strCampaignInfo,
      },
    });
    return response.body;
  },
  sendCampaign: async ({ accessToken, campaignkey }: SendCampaignParams) => {
    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${zohoCampaignsCommon.baseUrl}${zohoCampaignsCommon.endpoints.sendCampaign}`,
      headers: zohoCampaignsCommon.baseHeaders(accessToken),
      queryParams: {
        ...zohoCampaignsCommon.baseParams,
        campaignkey,
      },
    });
    return response.body;
  },
  addUpdateContact: async ({
    accessToken,
    ...contactParams
  }: AddUpdateContactParams) => {
    const contactinfo = JSON.stringify(contactParams.contactinfo);
    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${zohoCampaignsCommon.baseUrl}${zohoCampaignsCommon.endpoints.addUpdateContact}`,
      headers: zohoCampaignsCommon.baseHeaders(accessToken),
      queryParams: {
        ...zohoCampaignsCommon.baseParams,
        ...contactParams,
        contactinfo,
      },
    });
    return response.body;
  },
  addTagToContact: async ({
    accessToken,
    ...tagParams
  }: AddTagToContactParams) => {
    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${zohoCampaignsCommon.baseUrl}${zohoCampaignsCommon.endpoints.addTagToContact}`,
      headers: zohoCampaignsCommon.baseHeaders(accessToken),
      queryParams: {
        ...zohoCampaignsCommon.baseParams,
        ...tagParams,
      },
    });
    return response.body;
  },
  removeTag: async ({ accessToken, ...tagParams }: RemoveTagParams) => {
    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${zohoCampaignsCommon.baseUrl}${zohoCampaignsCommon.endpoints.removeTag}`,
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
    ...unsubscribeParams
  }: UnsubscribeContactParams) => {
    const contactinfo = JSON.stringify(unsubscribeParams.contactinfo);
    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${zohoCampaignsCommon.baseUrl}${zohoCampaignsCommon.endpoints.unsubscribeContact}`,
      headers: zohoCampaignsCommon.baseHeaders(accessToken),
      queryParams: {
        ...zohoCampaignsCommon.baseParams,
        ...unsubscribeParams,
        contactinfo,
      },
    });
    return response.body;
  },
  addContactToMailingList: async ({
    accessToken,
    ...mailingListParams
  }: AddContactToMailingListParams) => {
    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${zohoCampaignsCommon.baseUrl}${zohoCampaignsCommon.endpoints.addContactToMailingList}`,
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
    listkey,
    ...rest
  }: ListContactsParams) => {
    const { fromindex, range, ...otherParams } = rest;
    const strFromIndex =
      typeof fromindex === 'number' ? String(fromindex) : undefined;
    const strRange = typeof range === 'number' ? String(range) : undefined;
    const queryParams = {
      ...zohoCampaignsCommon.baseParams,
      listkey,
      ...otherParams,
    };
    if (strFromIndex) {
      Object.assign(queryParams, { fromindex: strFromIndex });
    }
    if (strRange) {
      Object.assign(queryParams, { range: strRange });
    }
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${zohoCampaignsCommon.baseUrl}${zohoCampaignsCommon.endpoints.listContacts}`,
      headers: zohoCampaignsCommon.baseHeaders(accessToken),
      queryParams,
    });
    return response.body;
  },
  listCampaigns: async ({
    accessToken,
    ...filterParams
  }: ListCampaignParams) => {
    const { fromindex, range, ...otherParams } = filterParams;
    const strFromIndex =
      typeof fromindex === 'number' ? String(fromindex) : undefined;
    const strRange = typeof range === 'number' ? String(range) : undefined;
    const queryParams = {
      ...zohoCampaignsCommon.baseParams,
      ...otherParams,
    };
    if (strFromIndex) {
      Object.assign(queryParams, { fromindex: strFromIndex });
    }
    if (strRange) {
      Object.assign(queryParams, { range: strRange });
    }
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${zohoCampaignsCommon.baseUrl}${zohoCampaignsCommon.endpoints.listCampaign}`,
      headers: zohoCampaignsCommon.baseHeaders(accessToken),
      queryParams,
    });
    return response.body;
  },
  listTopics: async ({ accessToken }: { accessToken: string }) => {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${zohoCampaignsCommon.baseUrl}${zohoCampaignsCommon.endpoints.listTopics}`,
      headers: zohoCampaignsCommon.baseHeaders(accessToken),
      queryParams: {
        ...zohoCampaignsCommon.baseParams,
      },
    });
    return response.body;
  },
  getCampaign: async ({ accessToken, campaignkey }: GetCampaignParams) => {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${zohoCampaignsCommon.baseUrl}${zohoCampaignsCommon.endpoints.getCampaign}`,
      headers: zohoCampaignsCommon.baseHeaders(accessToken),
      queryParams: {
        ...zohoCampaignsCommon.baseParams,
        campaignkey,
      },
    });
    return response.body;
  }
};
