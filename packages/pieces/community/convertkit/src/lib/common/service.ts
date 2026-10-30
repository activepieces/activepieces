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
  HttpMethod,
  HttpRequest,
  QueryParams,
} from '@activepieces/pieces-common';
import { Store } from '@activepieces/pieces-framework';
import { kitErrorStatus, kitHttp } from './http';

export const buildQueryParams = (
  auth: string,
  params: Record<string, string | number | undefined | null> = {}
): QueryParams => {
  const queryParams: QueryParams = { api_secret: auth };
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      queryParams[key] = String(value);
    }
  }
  return queryParams;
};

export const fetchBroadcasts = async (auth: string, page: number) => {
  const url = BROADCASTS_API_ENDPOINT;
  const request: HttpRequest = {
    url,
    method: HttpMethod.GET,
    queryParams: buildQueryParams(auth, { page, sort_order: 'desc' }),
  };
  const response = await kitHttp.sendRequest<{ broadcasts: Broadcast[] }>(
    request
  );

  const errorMessage = `Failed to fetch broadcasts. Response code: ${
    response.status
  } Response body: ${JSON.stringify(response.body)}`;

  if (response.status !== 200) {
    throw new Error(errorMessage);
  }

  if (response.body.broadcasts) {
    return response.body.broadcasts;
  }

  throw new Error(errorMessage);
};

export const fetchCustomFields = async (
  auth: string
): Promise<CustomField[]> => {
  const url = CUSTOM_FIELDS_API_ENDPOINT;

  const request: HttpRequest = {
    url,
    queryParams: buildQueryParams(auth),
    method: HttpMethod.GET,
  };
  const response = await kitHttp.sendRequest<{
    custom_fields: CustomField[];
  }>(request);

  const errorMessage = `Failed to fetch custom fields. Response code: ${
    response.status
  } Response body: ${JSON.stringify(response.body)}`;

  if (response.status !== 200) {
    throw new Error(errorMessage);
  }

  if (response.body.custom_fields) {
    return response.body.custom_fields;
  }

  throw new Error(errorMessage);
};

export const fetchForms = async (auth: string) => {
  const url = FORMS_API_ENDPOINT;

  const request: HttpRequest = {
    url,
    queryParams: buildQueryParams(auth),
    method: HttpMethod.GET,
  };
  const response = await kitHttp.sendRequest<{ forms: Form[] }>(request);

  const errorMessage = `Failed to fetch forms. Response code: ${
    response.status
  } Response body: ${JSON.stringify(response.body)}`;

  if (response.status !== 200) {
    throw new Error(errorMessage);
  }

  if (response.body.forms) {
    return response.body.forms;
  }

  throw new Error(errorMessage);
};

export const fetchPurchases = async (auth: string, page: number) => {
  const url = PURCHASES_API_ENDPOINT;

  const request: HttpRequest = {
    url,
    queryParams: buildQueryParams(auth, { page }),
    method: HttpMethod.GET,
  };
  const response = await kitHttp.sendRequest<{ purchases: Purchase[] }>(
    request
  );

  const errorMessage = `Failed to fetch purchases. Response code: ${
    response.status
  } Response body: ${JSON.stringify(response.body)}`;

  if (response.status !== 200) {
    throw new Error(errorMessage);
  }

  if (response.body.purchases) {
    return response.body.purchases;
  }

  throw new Error(errorMessage);
};

export const fetchSequences = async (auth: string) => {
  const url = SEQUENCES_API_ENDPOINT;
  const request: HttpRequest = {
    url,
    queryParams: buildQueryParams(auth),
    method: HttpMethod.GET,
  };
  const response = await kitHttp.sendRequest<{ courses: Sequence[] }>(
    request
  );

  const errorMessage = `Failed to fetch sequences. Response code: ${
    response.status
  } Response body: ${JSON.stringify(response.body)}`;

  if (response.status !== 200) {
    throw new Error(errorMessage);
  }
  if (response.body.courses) {
    return response.body.courses;
  }

  throw new Error(errorMessage);
};

export const fetchSubscriperById = async (
  auth: string,
  subscriberId: string
) => {
  const url = `${SUBSCRIBERS_API_ENDPOINT}/${subscriberId}`;

  const request: HttpRequest = {
    url,
    queryParams: buildQueryParams(auth),
    method: HttpMethod.GET,
  };

  const response = await kitHttp.sendRequest<{ subscriber: Subscriber }>(
    request
  );

  const errorMessage = `Failed to fetch subscriber. Response code: ${
    response.status
  } Response body: ${JSON.stringify(response.body)}`;

  if (response.status !== 200) {
    throw new Error(errorMessage);
  }
  if (response.body.subscriber) {
    return response.body.subscriber;
  }

  throw new Error(errorMessage);
};

export const fetchSubscriberByEmail = async (
  auth: string,
  email_address: string
) => {
  const url = SUBSCRIBERS_API_ENDPOINT;

  const request: HttpRequest = {
    url,
    queryParams: buildQueryParams(auth, { email_address }),
    method: HttpMethod.GET,
  };

  const response = await kitHttp.sendRequest<{ subscribers: Subscriber[] }>(
    request
  );

  const errorMessage = `Failed to fetch subscriber that match the provided email. Response code: ${
    response.status
  } Response body: ${JSON.stringify(response.body)}`;

  if (response.status !== 200) {
    throw new Error(errorMessage);
  }

  const subscriber = response.body.subscribers[0];
  if (subscriber) {
    return subscriber;
  }

  throw new Error(errorMessage);
};

export const fetchSubscribedTags = async (
  auth: string,
  subscriberId: string
) => {
  const url = `${SUBSCRIBERS_API_ENDPOINT}/${subscriberId}/tags`;

  const request: HttpRequest = {
    url,
    queryParams: buildQueryParams(auth),
    method: HttpMethod.GET,
  };

  const response = await kitHttp.sendRequest<{ tags: Tag[] }>(request);

  const errorMessage = `Failed to fetch tags. Response code: ${
    response.status
  } Response body: ${JSON.stringify(response.body)}`;

  if (response.status !== 200) {
    throw new Error(errorMessage);
  }
  if (response.body.tags) {
    return response.body.tags;
  }

  throw new Error(errorMessage);
};

export const fetchTags = async (auth: string) => {
  const url = TAGS_API_ENDPOINT;
  const request: HttpRequest = {
    url,
    queryParams: buildQueryParams(auth),
    method: HttpMethod.GET,
  };

  const response = await kitHttp.sendRequest<{ tags: Tag[] }>(request);

  const errorMessage = `Failed to fetch tags. Response code: ${
    response.status
  } Response body: ${JSON.stringify(response.body)}`;

  if (response.status !== 200) {
    throw new Error(errorMessage);
  }
  if (response.body.tags) {
    return response.body.tags;
  }

  throw new Error(errorMessage);
};

export const createWebhook = async (auth: string, payload: object) => {
  const body = { ...payload, api_secret: auth };

  const url = WEBHOOKS_API_ENDPOINT;

  const request: HttpRequest = {
    url,
    body,
    method: HttpMethod.POST,
  };

  const response = await kitHttp.sendRequest<{ rule: Webhook }>(request);

  const errorMessage = `Failed to create webhook. Response code: ${
    response.status
  } Response body: ${JSON.stringify(response.body)}`;

  if (response.status !== 200) {
    throw new Error(errorMessage);
  }

  if (response.body.rule) {
    return response.body.rule;
  }

  throw new Error(errorMessage);
};

export const removeWebhook = async (auth: string, ruleId: number) => {
  const url = `${WEBHOOKS_API_ENDPOINT}/${ruleId}`;
  const body = { api_secret: auth };

  const request: HttpRequest = {
    url,
    body,
    method: HttpMethod.DELETE,
  };

  const response = await kitHttp.sendRequest<{ success: boolean }>(request);

  const errorMessage = `Failed to remove webhook. Response code: ${
    response.status
  } Response body: ${JSON.stringify(response.body)}`;

  if (response.status !== 200) {
    throw new Error(errorMessage);
  }
  if (response.body.success) {
    return response.body.success;
  }

  throw new Error(errorMessage);
};

type WebhookInformation = {
  ruleId: number;
};

export const kitWebhookLifecycle = {
  async enable({
    apiSecret,
    store,
    storeKey,
    payload,
  }: {
    apiSecret: string;
    store: Store;
    storeKey: string;
    payload: object;
  }): Promise<void> {
    const rule = await createWebhook(apiSecret, payload);
    try {
      await store.put<WebhookInformation>(storeKey, { ruleId: rule.id });
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'unknown error';
      try {
        await removeWebhook(apiSecret, rule.id);
      } catch (cleanupError) {
        throw new Error(
          `Saving the Kit webhook rule ${rule.id} failed (${reason}) and removing it also failed (${
            cleanupError instanceof Error ? cleanupError.message : 'unknown error'
          }). Delete it in Kit to stop duplicate deliveries.`
        );
      }
      throw new Error(`Saving the Kit webhook rule failed, so it was removed again: ${reason}`);
    }
  },
  async disable({
    apiSecret,
    store,
    storeKey,
  }: {
    apiSecret: string;
    store: Store;
    storeKey: string;
  }): Promise<void> {
    const saved = await store.get<WebhookInformation>(storeKey);
    if (saved === null || saved === undefined) {
      return;
    }
    try {
      await removeWebhook(apiSecret, saved.ruleId);
    } catch (error) {
      if (kitErrorStatus(error) !== 404) {
        throw error;
      }
    }
    await store.delete(storeKey);
  },
};
