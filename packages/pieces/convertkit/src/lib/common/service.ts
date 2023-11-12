import {
  Broadcast,
  CustomField,
  Form,
  Purchase,
  Sequence,
  Subscriber,
  Tag,
  Webhook,
} from './types';
import {
  BROADCASTS_API_ENDPOINT,
  CUSTOM_FIELDS_API_ENDPOINT,
  FORMS_API_ENDPOINT,
  PURCHASES_API_ENDPOINT,
  SEQUENCES_API_ENDPOINT,
  SUBSCRIBERS_API_ENDPOINT,
  TAGS_API_ENDPOINT,
  WEBHOOKS_API_ENDPOINT,
} from './constants';
import {
  httpClient,
  HttpMethod,
  HttpRequest,
} from '@activepieces/pieces-common';

export const fetchBroadcasts = async (auth: string, page: number) => {
  const url = BROADCASTS_API_ENDPOINT;
  const body = {
    api_secret: auth,
    page,
  };
  const request: HttpRequest = {
    url,
    body,
    method: HttpMethod.GET,
  };
  const response = await httpClient.sendRequest<{ broadcasts: Broadcast[] }>(
    request
  );
  if (response.status !== 200) {
    throw new Error(
      `Failed to fetch broadcasts: ${response.status} ${response.body}`
    );
  }
  return response.body.broadcasts;
};

export const fetchCustomFields = async (
  auth: string
): Promise<CustomField[]> => {
  const url = CUSTOM_FIELDS_API_ENDPOINT;

  const body = {
    api_secret: auth,
  };

  const request: HttpRequest = {
    url,
    body,
    method: HttpMethod.GET,
  };
  const response = await httpClient.sendRequest<{
    custom_fields: CustomField[];
  }>(request);
  if (response.status !== 200) {
    throw new Error(
      `Failed to fetch custom fields: ${response.status} ${response.body}`
    );
  }

  return response.body.custom_fields;
};

export const fetchForms = async (auth: string) => {
  const url = FORMS_API_ENDPOINT;

  const body = {
    api_secret: auth,
  };

  const request: HttpRequest = {
    url,
    body,
    method: HttpMethod.GET,
  };
  const response = await httpClient.sendRequest<{ forms: Form[] }>(request);
  if (response.status !== 200) {
    throw new Error(
      `Failed to fetch forms: ${response.status} ${response.body}`
    );
  }
  return response.body.forms;
};

export const fetchPurchases = async (auth: string, page: number) => {
  const url = PURCHASES_API_ENDPOINT;

  const body = {
    api_secret: auth,
    page,
  };

  const request: HttpRequest = {
    url,
    body,
    method: HttpMethod.GET,
  };
  const response = await httpClient.sendRequest<{ purchases: Purchase[] }>(
    request
  );
  if (response.status !== 200) {
    throw new Error(
      `Failed to fetch purchases: ${response.status} ${response.body}`
    );
  }
  return response.body.purchases;
};

export const fetchSequences = async (auth: string) => {
  const url = SEQUENCES_API_ENDPOINT;
  const body = {
    api_secret: auth,
  };
  const request: HttpRequest = {
    url,
    body,
    method: HttpMethod.GET,
  };
  const response = await httpClient.sendRequest<{ courses: Sequence[] }>(
    request
  );
  if (response.status !== 200) {
    throw new Error(
      `Failed to fetch sequences: ${response.status} ${response.body}`
    );
  }
  return response.body.courses;
};

export const fetchSubscriperById = async (
  auth: string,
  subscriberId: string
) => {
  const url = `${SUBSCRIBERS_API_ENDPOINT}/${subscriberId}`;

  const body = {
    api_secret: auth,
  };

  const request: HttpRequest = {
    url,
    body,
    method: HttpMethod.GET,
  };

  const response = await httpClient.sendRequest<{ subscriber: Subscriber }>(
    request
  );

  if (response.status !== 200) {
    throw new Error(
      `Failed to fetch subscribers: ${response.status} ${response.body}`
    );
  }

  return response.body.subscriber;
};

export const fetchSubscriberByEmail = async (
  auth: string,
  email_address: string
) => {
  const url = SUBSCRIBERS_API_ENDPOINT;

  const body = {
    api_secret: auth,
    email_address,
  };

  const request: HttpRequest = {
    url,
    body,
    method: HttpMethod.GET,
  };

  const response = await httpClient.sendRequest<{ subscribers: Subscriber[] }>(
    request
  );

  if (response.status !== 200) {
    throw new Error(
      `Failed to fetch subscribers: ${response.status} ${response.body}`
    );
  }

  return response.body.subscribers[0];
};

export const fetchSubscribedTags = async (
  auth: string,
  subscriberId: string
) => {
  const url = `${SUBSCRIBERS_API_ENDPOINT}/${subscriberId}/tags`;

  const body = {
    api_secret: auth,
  };

  const request: HttpRequest = {
    url,
    body,
    method: HttpMethod.GET,
  };

  const response = await httpClient.sendRequest<{ tags: Tag[] }>(request);

  if (response.status !== 200) {
    throw new Error(
      `Failed to fetch tags: ${response.status} ${response.body}`
    );
  }

  return response.body.tags;
};

export const fetchTags = async (auth: string) => {
  const url = TAGS_API_ENDPOINT;
  const body = {
    api_secret: auth,
  };
  const request: HttpRequest = {
    url,
    body,
    method: HttpMethod.GET,
  };

  const response = await httpClient.sendRequest<{ tags: Tag[] }>(request);

  if (response.status !== 200) {
    throw new Error(
      `Failed to fetch tags: ${response.status} ${response.body}`
    );
  }

  return response.body.tags;
};

export const createWebhook = async (auth: string, payload: object) => {
  const body = { ...payload, api_secret: auth };

  const url = WEBHOOKS_API_ENDPOINT;

  const request: HttpRequest = {
    url,
    body,
    method: HttpMethod.POST,
  };

  const response = await httpClient.sendRequest<{ rule: Webhook }>(request);

  if (response.status !== 200) {
    throw new Error(
      `Failed to create webhook: ${response.status} ${response.body}`
    );
  }

  return response.body.rule;
};

export const removeWebhook = async (auth: string, ruleId: number) => {
  const url = `${WEBHOOKS_API_ENDPOINT}/${ruleId}`;
  const body = { api_secret: auth };

  const request: HttpRequest = {
    url,
    body,
    method: HttpMethod.DELETE,
  };

  const response = await httpClient.sendRequest<{ success: boolean }>(request);

  if (response.status !== 200) {
    throw new Error(
      `Failed to remove webhook: ${response.status} ${response.body}`
    );
  }

  return response.body.success;
};
