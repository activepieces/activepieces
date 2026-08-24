import { Property } from '@activepieces/pieces-framework';
import {
  HttpMethod,
  HttpMessageBody,
  httpClient,
  AuthenticationType,
} from '@activepieces/pieces-common';
import { plivoAuth } from '../..';

type PlivoCredentials = { username: string; password: string };

type PlivoCapability = 'sms' | 'voice';

const supportsCapability = (
  number: PlivoNumber,
  capability: PlivoCapability
): boolean =>
  capability === 'sms'
    ? number.sms_enabled !== false
    : number.voice_enabled !== false;

const loadPhoneNumbers = async (
  auth: PlivoCredentials | undefined,
  capability: PlivoCapability
) => {
  if (!auth) {
    return {
      disabled: true,
      placeholder: 'connect your account first',
      options: [],
    };
  }

  try {
    const numbers: PlivoNumber[] = [];
    const limit = 20;
    let offset = 0;
    for (;;) {
      const response = await callPlivoApi<NumberListResponse>(
        HttpMethod.GET,
        `Number/?limit=${limit}&offset=${offset}`,
        { auth_id: auth.username, auth_token: auth.password }
      );
      const page = response.body.objects ?? [];
      numbers.push(...page);
      offset += limit;
      if (page.length < limit || offset >= response.body.meta.total_count) {
        break;
      }
    }
    const usable = numbers.filter((number) =>
      supportsCapability(number, capability)
    );
    if (usable.length === 0) {
      return {
        disabled: true,
        placeholder:
          capability === 'sms'
            ? 'no SMS capable numbers on this account'
            : 'no voice capable numbers on this account',
        options: [],
      };
    }
    return {
      disabled: false,
      options: usable.map((number) => ({
        value: number.number,
        label: number.alias
          ? `+${number.number} (${number.alias})`
          : `+${number.number}`,
      })),
    };
  } catch (e) {
    return {
      disabled: true,
      placeholder: 'could not load numbers, check your credentials',
      options: [],
    };
  }
};

export const plivoCommon = {
  sms_phone_number: Property.Dropdown({
    auth: plivoAuth,
    description: 'The Plivo number to send the message from',
    displayName: 'From',
    required: true,
    refreshers: [],
    options: async ({ auth }) => await loadPhoneNumbers(auth, 'sms'),
  }),
  voice_phone_number: Property.Dropdown({
    auth: plivoAuth,
    description: 'The Plivo number to place the call from',
    displayName: 'From',
    required: true,
    refreshers: [],
    options: async ({ auth }) => await loadPhoneNumbers(auth, 'voice'),
  }),
  trigger_phone_number: Property.Dropdown({
    auth: plivoAuth,
    description:
      'The Plivo number that receives the incoming messages. Leave empty to set the Message URL by hand instead.',
    displayName: 'Phone Number',
    required: false,
    refreshers: [],
    options: async ({ auth }) => await loadPhoneNumbers(auth, 'sms'),
  }),
};

export const callPlivoApi = async <T extends HttpMessageBody>(
  method: HttpMethod,
  path: string,
  auth: { auth_id: string; auth_token: string },
  body?: unknown
) => {
  return await httpClient.sendRequest<T>({
    method,
    url: `https://api.plivo.com/v1/Account/${auth.auth_id}/${path}`,
    authentication: {
      type: AuthenticationType.BASIC,
      username: auth.auth_id,
      password: auth.auth_token,
    },
    headers: {
      'Content-Type': 'application/json',
    },
    body: body,
  });
};

const TRIGGER_APP_PREFIX = 'activepieces-plivo-trigger';

export interface PlivoManagedApp {
  appId: string;
  createdApp: boolean;
  previousAppId: string;
  digits: string;
  previousMessageUrl?: string;
  previousMessageMethod?: string;
}

const appIdFromResourceUri = (value?: string): string =>
  value ? String(value).split('/').filter(Boolean).pop() ?? '' : '';

// Activepieces serves a flow's production webhook at /webhooks/<flowId> and its
// test webhook at /webhooks/<flowId>/test. Comparing the flow id rather than the
// whole URL keeps both forms recognisable as the same owner.
const webhookFlowIdentity = (url?: string): string => {
  const match = /\/webhooks\/([^/?#]+)/.exec(url ?? '');
  return match ? match[1] : '';
};

export const provisionMessageWebhook = async (params: {
  auth: PlivoCredentials;
  number: string;
  webhookUrl: string;
}): Promise<PlivoManagedApp> => {
  const credentials = {
    auth_id: params.auth.username,
    auth_token: params.auth.password,
  };
  const digits = params.number.replace(/\D/g, '');
  const appName = `${TRIGGER_APP_PREFIX}-${digits}`;

  const numberDetail = await callPlivoApi<PlivoNumberDetail>(
    HttpMethod.GET,
    `Number/${digits}/`,
    credentials
  );
  const currentAppId = appIdFromResourceUri(numberDetail.body.application);

  let appId = '';
  let createdApp = false;
  let previousAppId = '';
  let previousMessageUrl = '';
  let previousMessageMethod = '';

  if (currentAppId) {
    const currentApp = await callPlivoApi<PlivoApplicationDetail>(
      HttpMethod.GET,
      `Application/${currentAppId}/`,
      credentials
    ).catch(() => undefined);

    if (currentApp?.body.app_name === appName) {
      const existingMessageUrl = currentApp.body.message_url ?? '';
      const existingIdentity = webhookFlowIdentity(existingMessageUrl);
      if (existingIdentity && existingIdentity !== webhookFlowIdentity(params.webhookUrl)) {
        throw new Error(
          `The number ${params.number} already routes incoming SMS to another active flow. A Plivo number can route incoming SMS to one flow at a time, so disable the other flow first.`
        );
      }
      appId = currentAppId;
      previousMessageUrl = existingMessageUrl;
      previousMessageMethod = currentApp.body.message_method ?? 'POST';
    } else if (currentApp) {
      previousAppId = currentAppId;
    }
  }

  try {
    if (!appId) {
      const createdApplication = await callPlivoApi<PlivoCreatedApplication>(
        HttpMethod.POST,
        'Application/',
        credentials,
        { app_name: appName }
      );
      appId = createdApplication.body.app_id;
      createdApp = true;
      await callPlivoApi(HttpMethod.POST, `Number/${digits}/`, credentials, {
        app_id: appId,
      });
    }

    await callPlivoApi(HttpMethod.POST, `Application/${appId}/`, credentials, {
      message_url: params.webhookUrl,
      message_method: 'POST',
    });
  } catch (error) {
    if (appId) {
      try {
        await releaseMessageWebhook({
          auth: params.auth,
          managed: {
            appId,
            createdApp,
            previousAppId,
            digits,
            previousMessageUrl,
            previousMessageMethod,
          },
        });
      } catch (cleanupError) {
        throw new Error(
          `Could not point ${params.number} at this flow, and undoing the change did not fully succeed. Application ${appId} may still hold the number, so inbound SMS can stay undelivered until it is corrected in the Plivo console. Original failure was ${(error as Error).message}. Cleanup failure was ${(cleanupError as Error).message}`
        );
      }
    }
    throw error;
  }

  return {
    appId,
    createdApp,
    previousAppId,
    digits,
    previousMessageUrl,
    previousMessageMethod,
  };
};

export const releaseMessageWebhook = async (params: {
  auth: PlivoCredentials;
  managed: PlivoManagedApp;
}): Promise<void> => {
  const credentials = {
    auth_id: params.auth.username,
    auth_token: params.auth.password,
  };
  const {
    appId,
    createdApp,
    previousAppId,
    digits,
    previousMessageUrl,
    previousMessageMethod,
  } = params.managed;
  if (!appId) {
    return;
  }

  const failures: string[] = [];
  const attempt = async (step: string, run: () => Promise<unknown>) => {
    try {
      await run();
    } catch (error) {
      failures.push(`${step} (${(error as Error).message})`);
    }
  };

  if (createdApp) {
    await attempt('detaching the webhook', () =>
      callPlivoApi(HttpMethod.POST, `Application/${appId}/`, credentials, {
        message_url: '',
      })
    );
    if (previousAppId) {
      await attempt(`returning the number to application ${previousAppId}`, () =>
        callPlivoApi(HttpMethod.POST, `Number/${digits}/`, credentials, {
          app_id: previousAppId,
        })
      );
    }
    await attempt(`deleting application ${appId}`, () =>
      callPlivoApi(HttpMethod.DELETE, `Application/${appId}/`, credentials)
    );
  } else {
    await attempt(`restoring the webhook on application ${appId}`, () =>
      callPlivoApi(HttpMethod.POST, `Application/${appId}/`, credentials, {
        message_url: previousMessageUrl ?? '',
        message_method: previousMessageMethod || 'POST',
      })
    );
  }

  if (failures.length > 0) {
    throw new Error(
      `Released this flow but Plivo cleanup for ${digits} did not fully complete. Outstanding steps were ${failures.join('; ')}. Check the number and its application in the Plivo console.`
    );
  }
};

interface PlivoNumber {
  number: string;
  alias: string;
  sms_enabled?: boolean;
  voice_enabled?: boolean;
}

interface NumberListResponse {
  meta: { limit: number; offset: number; total_count: number };
  objects: PlivoNumber[];
}

interface PlivoNumberDetail {
  application?: string;
}

interface PlivoApplicationDetail {
  app_name?: string;
  message_url?: string;
  message_method?: string;
}

interface PlivoCreatedApplication {
  app_id: string;
}
