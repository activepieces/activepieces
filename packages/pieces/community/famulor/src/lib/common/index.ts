import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import * as properties from './properties';
import * as schemas from './schemas';
import { 
  ListCampaignsResponse, 
  AddLeadParams, 
  SendSmsParams, 
  MakePhoneCallParams, 
  CampaignControlParams, 
  DeleteLeadParams,
  LeadResponse 
} from './types';

export const baseApiUrl = 'https://app.famulor.de/';

export const famulorCommon = {
  baseHeaders: (auth: string) => ({
    'Authorization': `Bearer ${auth}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }),

  // Properties
  addLeadProperties: properties.addLead,
  sendSmsProperties: properties.sendSms,
  makePhoneCallProperties: properties.makePhoneCall,
  campaignControlProperties: properties.campaignControl,
  deleteLeadProperties: properties.deleteLead,

  // Schemas
  addLeadSchema: schemas.addLead,
  sendSmsSchema: schemas.sendSms,
  makePhoneCallSchema: schemas.makePhoneCall,
  campaignControlSchema: schemas.campaignControl,
  deleteLeadSchema: schemas.deleteLead,

  // Methods
  listAllAssistants: async ({ auth, per_page = 10, page = 1, type }: { auth: string; per_page?: number; page?: number; type?: string }) => {
    const queryParams: Record<string, string> = {
      per_page: per_page.toString(),
      page: page.toString(),
    };
    
    if (type && type !== '') {
      queryParams['type'] = type;
    }

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${baseApiUrl}api/user/assistants/get`,
      headers: famulorCommon.baseHeaders(auth),
      queryParams,
    });

    if (response.status !== 200) {
      throw new Error(`Failed to fetch assistants: ${response.status}`);
    }

    return response.body;
  },

  listPhoneNumbers: async ({ auth }: { auth: string }) => {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${baseApiUrl}api/user/assistants/phone-numbers`,
      headers: famulorCommon.baseHeaders(auth),
    });

    if (response.status !== 200) {
      throw new Error(`Failed to fetch phone numbers: ${response.status}`);
    }

    return response.body || [];
  },

  listAssistants: async ({ auth }: { auth: string }) => {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${baseApiUrl}api/user/assistants/outbound`,
      headers: famulorCommon.baseHeaders(auth),
    });

    if (response.status !== 200) {
      throw new Error(`Failed to fetch assistants: ${response.status}`);
    }

    return response.body || [];
  },

  listLeads: async ({ auth }: { auth: string }) => {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${baseApiUrl}api/user/leads`,
      headers: famulorCommon.baseHeaders(auth),
    });

    if (response.status !== 200) {
      throw new Error(`Failed to fetch leads: ${response.status}`);
    }

    return response.body.leads || response.body;
  },

  listCampaigns: async ({ auth }: { auth: string }) => {
    const response = await httpClient.sendRequest<ListCampaignsResponse>({
      method: HttpMethod.GET,
      url: `${baseApiUrl}api/user/campaigns`,
      headers: famulorCommon.baseHeaders(auth),
    });

    if (response.status !== 200) {
      throw new Error(`Failed to fetch campaigns: ${response.status}`);
    }

    return response.body.campaigns || response.body;
  },

  addLead: async (params: AddLeadParams): Promise<LeadResponse> => {
    const { auth, ...body } = params;
    
    const response = await httpClient.sendRequest<LeadResponse>({
      method: HttpMethod.POST,
      url: `${baseApiUrl}api/user/lead`,
      headers: famulorCommon.baseHeaders(auth),
      body,
    });

    if (response.status !== 200) {
      throw new Error(`Failed to add lead: ${response.status}`);
    }

    return response.body;
  },

  sendSms: async (params: SendSmsParams) => {
    const { auth, ...body } = params;
    
    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${baseApiUrl}api/user/sms`,
      headers: famulorCommon.baseHeaders(auth),
      body,
    });

    if (response.status !== 200) {
      throw new Error(`Failed to send SMS: ${response.status}`);
    }

    return response.body;
  },

  makePhoneCall: async (params: MakePhoneCallParams) => {
    const { auth, ...body } = params;
    
    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${baseApiUrl}api/user/make_call`,
      headers: famulorCommon.baseHeaders(auth),
      body,
    });

    if (response.status !== 200) {
      throw new Error(`Failed to make phone call: ${response.status}`);
    }

    return response.body;
  },

  campaignControl: async (params: CampaignControlParams) => {
    const { auth, ...body } = params;
    
    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${baseApiUrl}api/user/campaigns/update-status`,
      headers: famulorCommon.baseHeaders(auth),
      body,
    });

    if (response.status !== 200) {
      throw new Error(`Failed to control campaign: ${response.status}`);
    }

    return response.body;
  },

  deleteLead: async (params: DeleteLeadParams) => {
    const { auth, lead_id } = params;
    
    const response = await httpClient.sendRequest({
      method: HttpMethod.DELETE,
      url: `${baseApiUrl}api/user/leads/${lead_id}`,
      headers: famulorCommon.baseHeaders(auth),
    });

    if (response.status !== 200) {
      throw new Error(`Failed to delete lead: ${response.status}`);
    }

    return response.body;
  },

  enableInboundWebhook: async ({ auth, assistant_id, webhook_url }: { auth: string; assistant_id: number; webhook_url: string }) => {
    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${baseApiUrl}api/user/assistants/enable-inbound-webhook`,
      headers: famulorCommon.baseHeaders(auth),
      body: {
        assistant_id,
        webhook_url,
      },
    });

    if (response.status !== 200) {
      throw new Error(`Failed to enable inbound webhook: ${response.status}`);
    }

    return response.body;
  },

  disableInboundWebhook: async ({ auth, assistant_id }: { auth: string; assistant_id: number }) => {
    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${baseApiUrl}api/user/assistants/disable-inbound-webhook`,
      headers: famulorCommon.baseHeaders(auth),
      body: {
        assistant_id,
      },
    });

    if (response.status !== 200) {
      throw new Error(`Failed to disable inbound webhook: ${response.status}`);
    }

    return response.body;
  },

  enablePostCallWebhook: async ({ auth, assistant_id, webhook_url }: { auth: string; assistant_id: number; webhook_url: string }) => {
    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${baseApiUrl}api/user/assistants/enable-webhook`,
      headers: famulorCommon.baseHeaders(auth),
      body: {
        assistant_id,
        webhook_url,
      },
    });

    if (response.status !== 200) {
      throw new Error(`Failed to enable post-call webhook: ${response.status}`);
    }

    return response.body;
  },

  disablePostCallWebhook: async ({ auth, assistant_id }: { auth: string; assistant_id: number }) => {
    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${baseApiUrl}api/user/assistants/disable-webhook`,
      headers: famulorCommon.baseHeaders(auth),
      body: {
        assistant_id,
      },
    });

    if (response.status !== 200) {
      throw new Error(`Failed to disable post-call webhook: ${response.status}`);
    }

    return response.body;
  },
};
