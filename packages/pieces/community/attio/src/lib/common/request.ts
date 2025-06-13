import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { API_ENDPOINTS, attioWebhookEventType, BASE_URL } from './constants';

async function fireHttpRequest({
  auth,
  method,
  path,
  body,
}: {
  auth: string;
  method: HttpMethod;
  path: string;
  body?: unknown;
}) {
  return await httpClient
    .sendRequest({
      method,
      url: `${BASE_URL}${path}`,
      headers: {
        Authorization: `Bearer ${auth}`,
        'Content-Type': 'application/json',
      },
      body,
    })
    .then((res) => res.body);
}

export const attioApiService = {
  createRecord: async ({
    auth,
    object,
    payload,
  }: {
    auth: string;
    object: string;
    payload: {
      values: {
        [x: string]: any;
      };
    };
  }) => {
    const response = await fireHttpRequest({
      auth,
      method: HttpMethod.POST,
      path: `/objects/${object}/records`,
      body: {
        data: payload,
      },
    });

    return response.data;
  },
  findRecord: async ({
    auth,
    object,
    payload,
  }: {
    auth: string;
    object: string;
    payload: any;
  }) => {
    const response = await fireHttpRequest({
      auth,
      method: HttpMethod.POST,
      path: `/objects/${object}/records/query`,
      body: {
        ...payload,
      },
    });

    return response.data;
  },
  updateRecord: async ({
    auth,
    object,
    recordId,
    payload,
  }: {
    auth: string;
    object: string;
    recordId: string;
    payload: {
      values: {
        [x: string]: any;
      };
    };
  }) => {
    const response = await fireHttpRequest({
      auth,
      method: HttpMethod.PATCH,
      path: `/objects/${object}/records/${recordId}`,
      body: {
        data: payload,
      },
    });

    return response.data;
  },
  createEntry: async ({
    auth,
    list,
    payload,
  }: {
    auth: string;
    list: string;
    payload: {
      parent_record_id: string;
      parent_object: string;
      entry_values: {
        [x: string]: any;
      };
    };
  }) => {
    const response = await fireHttpRequest({
      auth,
      method: HttpMethod.POST,
      path: `/lists/${list}/entries`,
      body: {
        data: payload,
      },
    });

    return response.data;
  },
  findEntry: async ({
    auth,
    list,
    payload,
  }: {
    auth: string;
    list: string;
    payload: any;
  }) => {
    const response = await fireHttpRequest({
      auth,
      method: HttpMethod.POST,
      path: `/lists/${list}/entries/query`,
      body: {
        ...payload,
      },
    });

    return response.data;
  },
  updateEntry: async ({
    auth,
    list,
    entryId,
    payload,
  }: {
    auth: string;
    list: string;
    entryId: string;
    payload: {
      entry_values: {
        [x: string]: any;
      };
    };
  }) => {
    const response = await fireHttpRequest({
      auth,
      method: HttpMethod.PATCH,
      path: `/lists/${list}/entries/${entryId}`,
      body: {
        data: payload,
      },
    });

    return response.data;
  },
  createWebhook: async (
    auth: string,
    webhookUrl: string,
    event_type: attioWebhookEventType
  ) => {
    const response = await fireHttpRequest({
      auth,
      method: HttpMethod.POST,
      path: API_ENDPOINTS.CREATE_WEBHOOK,
      body: {
        data: {
          target_url: webhookUrl,
          subscriptions: [
            {
              event_type,
              filter: null,
            },
          ],
        },
      },
    });

    return response.data;
  },
  deleteWebhook: async (auth: string, webhookId: string) => {
    return fireHttpRequest({
      auth,
      method: HttpMethod.DELETE,
      path: `${API_ENDPOINTS.DELETE_WEBHOOK}/${webhookId}`,
    });
  },
  getListByListName: async (auth: string, name: string) => {
    const response = await fireHttpRequest({
      auth,
      method: HttpMethod.GET,
      path: `/lists`
    })

    const lists = response.data;

    const list = lists.find((l: any) => l.name.toLowerCase() === name.toLowerCase());
    
    if(!list) throw new Error('List not found');
    
    return list
  }
};
