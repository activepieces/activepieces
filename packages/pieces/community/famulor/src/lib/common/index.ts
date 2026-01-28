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
  LeadResponse,
  GetCurrentUserResponse,
  GenerateAiReplyParams,
  GenerateAiReplyResponse,
  CreateConversationParams,
  CreateConversationResponse,
  GetConversationParams,
  GetConversationResponse,
  SendMessageParams,
  SendMessageResponse
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
  getCurrentUserProperties: properties.getCurrentUser,
  generateAiReplyProperties: properties.generateAiReply,
  createConversationProperties: properties.createConversation,
  getConversationProperties: properties.getConversation,
  sendMessageProperties: properties.sendMessage,

  // Schemas
  addLeadSchema: schemas.addLead,
  sendSmsSchema: schemas.sendSms,
  makePhoneCallSchema: schemas.makePhoneCall,
  campaignControlSchema: schemas.campaignControl,
  deleteLeadSchema: schemas.deleteLead,
  getCurrentUserSchema: schemas.getCurrentUser,
  generateAiReplySchema: schemas.generateAiReply,
  createConversationSchema: schemas.createConversation,
  getConversationSchema: schemas.getConversation,
  sendMessageSchema: schemas.sendMessage,

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

  getCurrentUser: async ({ auth }: { auth: string }): Promise<GetCurrentUserResponse> => {
    const response = await httpClient.sendRequest<GetCurrentUserResponse>({
      method: HttpMethod.GET,
      url: `${baseApiUrl}api/user/me`,
      headers: famulorCommon.baseHeaders(auth),
    });

    if (response.status !== 200) {
      throw new Error(`Failed to get current user: ${response.status}`);
    }

    return response.body;
  },

  generateAiReply: async (params: GenerateAiReplyParams): Promise<GenerateAiReplyResponse> => {
    const { auth, ...body } = params;
    
    const response = await httpClient.sendRequest<GenerateAiReplyResponse>({
      method: HttpMethod.POST,
      url: `${baseApiUrl}api/ai/generate-reply`,
      headers: famulorCommon.baseHeaders(auth),
      body,
    });

    if (response.status !== 200 && response.status !== 404 && response.status !== 402 && response.status !== 422 && response.status !== 429) {
      throw new Error(`Failed to generate AI reply: ${response.status}`);
    }

    return response.body;
  },

  createConversation: async (params: CreateConversationParams): Promise<CreateConversationResponse> => {
    const { auth, ...body } = params;
    
    const response = await httpClient.sendRequest<CreateConversationResponse>({
      method: HttpMethod.POST,
      url: `${baseApiUrl}api/conversations`,
      headers: famulorCommon.baseHeaders(auth),
      body,
    });

    if (response.status !== 200 && response.status !== 404 && response.status !== 400) {
      throw new Error(`Failed to create conversation: ${response.status}`);
    }

    return response.body;
  },

  getConversation: async (params: GetConversationParams): Promise<GetConversationResponse> => {
    const { auth, uuid } = params;
    
    const response = await httpClient.sendRequest<GetConversationResponse>({
      method: HttpMethod.GET,
      url: `${baseApiUrl}api/conversations/${uuid}`,
      headers: famulorCommon.baseHeaders(auth),
    });

    if (response.status !== 200 && response.status !== 404) {
      throw new Error(`Failed to get conversation: ${response.status}`);
    }

    return response.body;
  },

  sendMessage: async (params: SendMessageParams): Promise<SendMessageResponse> => {
    const { auth, uuid, message } = params;
    
    const response = await httpClient.sendRequest<SendMessageResponse>({
      method: HttpMethod.POST,
      url: `${baseApiUrl}api/conversations/${uuid}/messages`,
      headers: famulorCommon.baseHeaders(auth),
      body: { message },
    });

    if (response.status !== 200 && response.status !== 404 && response.status !== 400 && response.status !== 422) {
      throw new Error(`Failed to send message: ${response.status}`);
    }

    return response.body;
  },
};
