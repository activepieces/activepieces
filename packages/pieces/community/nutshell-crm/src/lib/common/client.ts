import {
  httpClient,
  HttpMethod,
  AuthenticationType,
  HttpResponse,
} from '@activepieces/pieces-common';

const NUTSHELL_API_BASE = 'https://app.nutshell.com/api/v1/json';

interface NutshellAuth {
  email: string;
  apiKey: string;
}

interface JsonRpcRequest {
  method: string;
  params: Record<string, unknown>;
  id: number;
}

interface JsonRpcResponse {
  result: unknown;
  error?: { message: string; code: number };
}

let requestId = 1;

async function rpcCall(
  auth: NutshellAuth,
  method: string,
  params: Record<string, unknown> = {}
): Promise<unknown> {
  const body: JsonRpcRequest = {
    method,
    params,
    id: requestId++,
  };

  const response: HttpResponse = await httpClient.sendRequest({
    method: HttpMethod.POST,
    url: NUTSHELL_API_BASE,
    authentication: {
      type: AuthenticationType.BASIC,
      username: auth.email,
      password: auth.apiKey,
    },
    body: [body],
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const results = response.body as JsonRpcResponse[];
  if (results && results[0]) {
    if (results[0].error) {
      throw new Error(`Nutshell API error: ${results[0].error.message}`);
    }
    return results[0].result;
  }
  throw new Error('Unexpected response from Nutshell API');
}

export const nutshellClient = {
  async getLead(auth: NutshellAuth, leadId: number) {
    return rpcCall(auth, 'getLead', { leadId });
  },

  async createLead(auth: NutshellAuth, lead: Record<string, unknown>) {
    return rpcCall(auth, 'newLead', { lead });
  },

  async updateLead(auth: NutshellAuth, leadId: number, lead: Record<string, unknown>) {
    return rpcCall(auth, 'editLead', { leadId, lead });
  },

  async getContact(auth: NutshellAuth, contactId: number) {
    return rpcCall(auth, 'getContact', { contactId });
  },

  async createContact(auth: NutshellAuth, contact: Record<string, unknown>) {
    return rpcCall(auth, 'newContact', { contact });
  },

  async updateContact(auth: NutshellAuth, contactId: number, contact: Record<string, unknown>) {
    return rpcCall(auth, 'editContact', { contactId, contact });
  },

  async searchContacts(auth: NutshellAuth, query: string, limit = 25) {
    return rpcCall(auth, 'findContacts', { query, limit });
  },

  async getCompany(auth: NutshellAuth, accountId: number) {
    return rpcCall(auth, 'getAccount', { accountId });
  },

  async createCompany(auth: NutshellAuth, account: Record<string, unknown>) {
    return rpcCall(auth, 'newAccount', { account });
  },

  async updateCompany(auth: NutshellAuth, accountId: number, account: Record<string, unknown>) {
    return rpcCall(auth, 'editAccount', { accountId, account });
  },

  async searchCompanies(auth: NutshellAuth, query: string, limit = 25) {
    return rpcCall(auth, 'findAccounts', { query, limit });
  },

  async searchLeads(auth: NutshellAuth, query: string, limit = 25) {
    return rpcCall(auth, 'findLeads', { query, limit });
  },
};
