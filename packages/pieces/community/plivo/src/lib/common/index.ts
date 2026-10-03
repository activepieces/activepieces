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
        'Number/',
        { auth_id: auth.username, auth_token: auth.password },
        undefined,
        { limit: String(limit), offset: String(offset) }
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
    const status = (e as { response?: { status?: number } })?.response?.status;
    const unauthorised = status === 401 || status === 403;
    return {
      disabled: true,
      placeholder: unauthorised
        ? 'could not load numbers, check your Auth ID and Auth Token'
        : `could not load numbers from Plivo${status ? ` (HTTP ${status})` : ''}, try again`,
      options: [],
    };
  }
};

const phoneNumberDropdown = (options: {
  displayName: string;
  description: string;
  required: boolean;
  capability: PlivoCapability;
}) =>
  Property.Dropdown({
    auth: plivoAuth,
    displayName: options.displayName,
    description: options.description,
    required: options.required,
    refreshers: [],
    options: async ({ auth }) => await loadPhoneNumbers(auth, options.capability),
  });

export const plivoCommon = {
  sms_phone_number: phoneNumberDropdown({
    displayName: 'From',
    description: 'The Plivo number to send the message from',
    required: true,
    capability: 'sms',
  }),
  voice_phone_number: phoneNumberDropdown({
    displayName: 'From',
    description: 'The Plivo number to place the call from',
    required: true,
    capability: 'voice',
  }),
  trigger_phone_number: phoneNumberDropdown({
    displayName: 'Phone Number',
    description:
      'The Plivo number that receives the incoming messages. Leave empty to set the Message URL by hand instead.',
    required: false,
    capability: 'sms',
  }),
  trigger_voice_phone_number: phoneNumberDropdown({
    displayName: 'Phone Number',
    description:
      'The Plivo number that receives the incoming calls. Leave empty to set the Answer URL by hand instead.',
    required: false,
    capability: 'voice',
  }),
};

export const callPlivoApi = async <T extends HttpMessageBody>(
  method: HttpMethod,
  path: string,
  auth: { auth_id: string; auth_token: string },
  body?: unknown,
  queryParams?: Record<string, string>
) => {
  return await httpClient.sendRequest<T>({
    method,
    url: `https://api.plivo.com/v1/Account/${auth.auth_id}/${path}`,
    queryParams,
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
// The application is shared, so the address to restore the number to is recorded on the
// application itself rather than in one trigger's private storage. A trigger that reuses
// an application it did not create can then still hand the number back correctly, and a
// lifecycle that never saw the original assignment cannot lose it.
const PREVIOUS_APP_MARKER = '--prev-';
const NO_PREVIOUS_APP = 'none';

// A Plivo number belongs to exactly one application, so the SMS and the voice trigger
// have to share one application per number. Each trigger owns a single URL field on it.
export type PlivoWebhookKind = 'message' | 'answer';

const URL_FIELD: Record<PlivoWebhookKind, { url: string; method: string }> = {
  message: { url: 'message_url', method: 'message_method' },
  answer: { url: 'answer_url', method: 'answer_method' },
};

export interface PlivoManagedApp {
  appId: string;
  createdApp: boolean;
  digits: string;
  kind: PlivoWebhookKind;
  registeredUrl: string;
  previousUrl?: string;
  previousMethod?: string;
}

const appIdFromResourceUri = (value?: string): string =>
  value ? String(value).split('/').filter(Boolean).pop() ?? '' : '';

// Activepieces serves a flow's production webhook at /webhooks/<flowId>, its synchronous
// variant at /webhooks/<flowId>/sync and its test webhook at /webhooks/<flowId>/test.
// Comparing the flow id rather than the whole URL keeps every form recognisable as the
// same owner.
const webhookFlowIdentity = (url?: string): string => {
  const match = /\/webhooks\/([^/?#]+)/.exec(url ?? '');
  return match ? match[1] : '';
};

const managedAppName = (digits: string, previousAppId: string): string =>
  `${TRIGGER_APP_PREFIX}-${digits}${PREVIOUS_APP_MARKER}${
    previousAppId.length > 0 ? previousAppId : NO_PREVIOUS_APP
  }`;

const isManagedAppName = (appName: string | undefined, digits: string): boolean =>
  (appName ?? '').startsWith(`${TRIGGER_APP_PREFIX}-${digits}`);

// undefined means the application predates this marker, so the original assignment is
// unknown and the application must be left in place rather than guessed at.
const previousAppIdFromName = (appName?: string): string | undefined => {
  const index = (appName ?? '').indexOf(PREVIOUS_APP_MARKER);
  if (index < 0) {
    return undefined;
  }
  const recorded = (appName as string).slice(index + PREVIOUS_APP_MARKER.length);
  return recorded === NO_PREVIOUS_APP ? '' : recorded;
};

const urlFieldsOf = (app?: PlivoApplicationDetail) => ({
  message_url: app?.message_url ?? '',
  answer_url: app?.answer_url ?? '',
});

const readApplication = async (
  credentials: { auth_id: string; auth_token: string },
  appId: string
): Promise<PlivoApplicationDetail> => {
  const response = await callPlivoApi<PlivoApplicationDetail>(
    HttpMethod.GET,
    `Application/${appId}/`,
    credentials
  );
  return response.body;
};

export const provisionWebhook = async (params: {
  auth: PlivoCredentials;
  number: string;
  webhookUrl: string;
  kind: PlivoWebhookKind;
}): Promise<PlivoManagedApp> => {
  const credentials = {
    auth_id: params.auth.username,
    auth_token: params.auth.password,
  };
  const digits = params.number.replace(/\D/g, '');
  const field = URL_FIELD[params.kind];
  const ourIdentity = webhookFlowIdentity(params.webhookUrl);

  const numberDetail = await callPlivoApi<PlivoNumberDetail>(
    HttpMethod.GET,
    `Number/${digits}/`,
    credentials
  );
  const currentAppId = appIdFromResourceUri(numberDetail.body.application);

  let appId = '';
  let createdApp = false;
  let previousAppId = '';
  let previousUrl = '';
  let previousMethod = '';

  if (currentAppId) {
    // Reading the current application decides both whether the number can be taken and
    // where it has to be returned, so a failed read has to stop the enable. Treating it
    // as "no application" would take a number from another flow and lose the address to
    // give it back to.
    let currentApp: PlivoApplicationDetail;
    try {
      currentApp = await readApplication(credentials, currentAppId);
    } catch (error) {
      throw new Error(
        `Could not read the Plivo application currently assigned to ${params.number}, so the number was left untouched. ${(error as Error).message}`
      );
    }

    if (isManagedAppName(currentApp.app_name, digits)) {
      const fields = urlFieldsOf(currentApp);
      const existingUrl = fields[field.url as keyof typeof fields];
      const existingIdentity = webhookFlowIdentity(existingUrl);
      if (existingIdentity && existingIdentity !== ourIdentity) {
        throw new Error(
          `The number ${params.number} already routes this traffic to another active flow. A Plivo number can route it to one flow at a time, so disable the other flow first.`
        );
      }
      appId = currentAppId;
      // Only the exact URL this lifecycle registered is its own leftover. A different URL
      // for the same flow belongs to its other lifecycle, because a test run and the
      // published flow share one application, so it has to be restored on release.
      if (existingUrl !== params.webhookUrl) {
        previousUrl = existingUrl;
        previousMethod =
          (currentApp as Record<string, string | undefined>)[field.method] ?? 'POST';
      }
    } else {
      previousAppId = currentAppId;
    }
  }

  try {
    if (!appId) {
      const createdApplication = await callPlivoApi<PlivoCreatedApplication>(
        HttpMethod.POST,
        'Application/',
        credentials,
        { app_name: managedAppName(digits, previousAppId) }
      );
      appId = createdApplication.body.app_id;
      createdApp = true;
      await callPlivoApi(HttpMethod.POST, `Number/${digits}/`, credentials, {
        app_id: appId,
      });
    }

    await callPlivoApi(HttpMethod.POST, `Application/${appId}/`, credentials, {
      [field.url]: params.webhookUrl,
      [field.method]: 'POST',
    });
  } catch (error) {
    try {
      await releaseWebhook({
        auth: params.auth,
        managed: {
          appId,
          createdApp,
          digits,
          kind: params.kind,
          registeredUrl: params.webhookUrl,
          previousUrl,
          previousMethod,
        },
      });
    } catch (cleanupError) {
      throw new Error(
        `Could not point ${params.number} at this flow, and undoing the change did not fully succeed. Application ${appId} may still hold the number, so inbound traffic can stay undelivered until it is corrected in the Plivo console. Original failure was ${(error as Error).message}. Cleanup failure was ${(cleanupError as Error).message}`
      );
    }
    throw error;
  }

  return {
    appId,
    createdApp,
    digits,
    kind: params.kind,
    registeredUrl: params.webhookUrl,
    previousUrl,
    previousMethod,
  };
};

export const releaseWebhook = async (params: {
  auth: PlivoCredentials;
  managed: PlivoManagedApp;
}): Promise<void> => {
  const credentials = {
    auth_id: params.auth.username,
    auth_token: params.auth.password,
  };
  const { appId, digits, kind, registeredUrl, previousUrl, previousMethod } =
    params.managed;
  if (!appId) {
    return;
  }
  const field = URL_FIELD[kind];

  const failures: string[] = [];
  const attempt = async (step: string, run: () => Promise<unknown>) => {
    try {
      await run();
      return true;
    } catch (error) {
      failures.push(`${step} (${(error as Error).message})`);
      return false;
    }
  };

  let current: PlivoApplicationDetail | undefined;
  try {
    current = await readApplication(credentials, appId);
  } catch (error) {
    // Without knowing the application's present state, neither clearing nor deleting is
    // safe, because another trigger may have taken this field over in the meantime.
    throw new Error(
      `Released this flow but could not read Plivo application ${appId}, so nothing was changed there. Check the number ${digits} and its application in the Plivo console. ${(error as Error).message}`
    );
  }

  const fields = urlFieldsOf(current);
  const liveUrl = fields[field.url as keyof typeof fields];
  // Another lifecycle of this flow, a test run for instance, may have replaced this URL
  // since it was registered. Only the lifecycle whose URL is still in place may undo it.
  if (registeredUrl && liveUrl && liveUrl !== registeredUrl) {
    return;
  }

  const restoreTo = previousUrl ?? '';
  const cleared = await attempt(`clearing the ${field.url}`, () =>
    callPlivoApi(HttpMethod.POST, `Application/${appId}/`, credentials, {
      [field.url]: restoreTo,
      [field.method]: previousMethod || 'POST',
    })
  );

  const otherField = URL_FIELD[kind === 'message' ? 'answer' : 'message'];
  const otherUrl = fields[otherField.url as keyof typeof fields];
  const nothingLeft = cleared && restoreTo.length === 0 && otherUrl.length === 0;
  const previousAppId = previousAppIdFromName(current.app_name);

  if (
    nothingLeft &&
    isManagedAppName(current.app_name, digits) &&
    previousAppId !== undefined
  ) {
    let handedBack = true;
    if (previousAppId.length > 0) {
      handedBack = await attempt(
        `returning the number to application ${previousAppId}`,
        () =>
          callPlivoApi(HttpMethod.POST, `Number/${digits}/`, credentials, {
            app_id: previousAppId,
          })
      );
    }
    // Deleting while the number still points at this application would leave the number
    // on an application that no longer exists.
    if (handedBack) {
      await attempt(`deleting application ${appId}`, () =>
        callPlivoApi(HttpMethod.DELETE, `Application/${appId}/`, credentials)
      );
    }
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
  answer_url?: string;
  answer_method?: string;
}

interface PlivoCreatedApplication {
  app_id: string;
}
