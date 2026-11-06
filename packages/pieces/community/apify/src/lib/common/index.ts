import {
  ActorClient,
  ActorListSortBy,
  ApifyClient,
  Build,
  Dictionary,
  TaskClient,
  WebhookCondition,
  WebhookEventType
} from 'apify-client';
import { Property } from '@activepieces/pieces-framework';
import { createHash } from 'crypto';
import { apifyAuth } from '../..';

export type ApifyAuth = {
  props: {
    apikey: string;
  };
};

type DropdownOption = {
  value: string;
  label: string;
};

type Item = {
  id: string;
  title?: string;
  username?: string;
  name?: string;
};

export type ActorBuild = Build & {
  actorDefinition?: {
    input?: {
      properties?: Record<string, { prefill?: unknown | null; }>;
    };
  };
};

export enum RunType {
  ACTOR = 'Actor',
  TASK = 'task',
}

// Memory options for actor/task runs
export const MEMORY_OPTIONS = [
  { value: 128, label: '128 MB' },
  { value: 256, label: '256 MB' },
  { value: 512, label: '512 MB' },
  { value: 1024, label: '1024 MB' },
  { value: 2048, label: '2048 MB' },
  { value: 4096, label: '4096 MB' },
  { value: 8192, label: '8192 MB' },
  { value: 16384, label: '16384 MB' },
  { value: 32768, label: '32768 MB' }
];

export const TERMINAL_STATUSES: WebhookEventType[] = [
  'ACTOR.RUN.SUCCEEDED',
  'ACTOR.RUN.FAILED',
  'ACTOR.RUN.TIMED_OUT',
  'ACTOR.RUN.ABORTED',
];

export const STATUS_OPTIONS: { label: string; value: WebhookEventType }[] = [
  {
    label: 'Aborted',
    value: 'ACTOR.RUN.ABORTED',
  },
  {
    label: 'Failed',
    value: 'ACTOR.RUN.FAILED',
  },
  {
    label: 'Succeeded',
    value: 'ACTOR.RUN.SUCCEEDED',
  },
  {
    label: 'Timed Out',
    value: 'ACTOR.RUN.TIMED_OUT',
  },
];

// Helper to create an Apify client instance with tracking header
export const createApifyClient = (apiKey: string): ApifyClient => {
  return new ApifyClient({
    token: apiKey,
    requestInterceptors: [
      (request) => {
        if (!request.headers) {
          request.headers = {};
        }
        request.headers['x-apify-integration-platform'] = 'activepieces';
        return request;
      },
    ],
  });
};

const mapActorToDropdownOption = (item: Item): DropdownOption => {
  const optionName = item.title
    ? `${item.title} (${item.username}/${item.name})`
    : `${item.username}/${item.name}`;

  return {
    label: optionName,
    value: item.id,
  };
};

const mapTaskToDropdownOption = (item: Item): DropdownOption => {
  return {
    label: item.title || item.name || item.id,
    value: item.id,
  };
};

export const listActors = async ({
  apiKey,
  actorSource,
  search,
}: {
  apiKey: string;
  actorSource: string | undefined;
  search: string | undefined;
}): Promise<DropdownOption[]> => {
  const client = createApifyClient(apiKey);
  const query = search?.trim() ?? '';

  if (actorSource === 'recent') {
    const recentActors = await client.actors().list({
      offset: 0,
      sortBy: ActorListSortBy.LAST_RUN_STARTED_AT,
      desc: true,
      limit: 1000,
    });
    const options = recentActors.items.map(mapActorToDropdownOption);
    const lowerQuery = query.toLowerCase();
    return lowerQuery
      ? options.filter((option) => option.label.toLowerCase().includes(lowerQuery))
      : options;
  }

  const storeActors = await client.store().list({
    limit: 1000,
    offset: 0,
    ...(query ? { search: query } : {}),
  });
  return storeActors.items.map(mapActorToDropdownOption);
};

export const fetchActorInputSchema = async (apiKey: string, actorId: string): Promise<Build | undefined> => {
  const client = createApifyClient(apiKey);
  const defaultBuild = await client.actor(actorId).defaultBuild();
  const build = await defaultBuild.get();

  return build;
};

export const getDefaultValuesFromBuild = (build: ActorBuild): Dictionary => {
  const properties = build?.actorDefinition?.input?.properties;

  if (!properties) {
    return {};
  }

  const defaultValues: Dictionary = {};

  for (const [key, property] of Object.entries(properties)) {
    if (property?.prefill != null) {
      defaultValues[key] = property.prefill;
    }
  }

  return defaultValues;
};

export const listTasks = async (apiKey: string): Promise<DropdownOption[]> => {
  const client = createApifyClient(apiKey);
  const tasks = await client.tasks().list({
    limit: 1000,
    offset: 0,
  });
  return tasks.items.map(mapTaskToDropdownOption);
};

export const listDatasets = async (apiKey: string): Promise<DropdownOption[]> => {
  const client = createApifyClient(apiKey);
  const dataset = await client.datasets().list({
    desc: true,
  });

  return dataset.items.map(item => {
    const name = item.title || item.name;
    const count = `${item.itemCount} ${pluralize(item.itemCount)}`;
    return {
      value: item.id,
      label: name ? `${name} (${count} - ${item.id})` : `${item.id} (${count})`,
    };
  });
};

export const listStores = async (apiKey: string): Promise<DropdownOption[]> => {
  const client = createApifyClient(apiKey);
  const stores = await client.keyValueStores().list({
    desc: true
  });

  return stores.items.map(item => ({
    value: item.id,
    label: item.title || item.name || item.id
  }));
};

export const listRecords = async (apiKey: string, storeId: string): Promise<DropdownOption[]> => {
  const client = createApifyClient(apiKey);
  const records = await client.keyValueStore(storeId).listKeys();

  return records.items.map(item => ({
    value: item.key,
    label: item.key
  }));
};

export const pluralize = (n: number): string => n === 1 ? "item" : "items";

export const getErrorMessage = (error: unknown): string => error instanceof Error ? error.message : String(error);

// File extension mapping for key-value store records
export const getFileExtension = (contentType: string): string => {
  const extensions: Record<string, string> = {
    'image/png': '.png',
    'image/jpeg': '.jpg',
    'application/pdf': '.pdf',
    'application/zip': '.zip',
    'text/html': '.html',
    'text/csv': '.csv',
    'application/json': '.json',
    'text/plain': '.txt'
  };

  return extensions[contentType] || '';
};

export const isBinaryContentType = (contentType: string): boolean => {
  if (!contentType) return false;

  if (contentType.includes('application/json') || contentType.includes('text/')) {
    return false;
  }

  return true;
};


export const createDropdownOptions = async (
  auth: unknown,
  fetchItems: (apiKey: string) => Promise<DropdownOption[]>
): Promise<{ disabled: boolean; options: DropdownOption[]; placeholder?: string; }> => {
  if (!isApifyAuth(auth)) {
    return {
      disabled: true,
      options: [],
      placeholder: 'Connect your Apify account first.',
    };
  }

  try {
    const items = await fetchItems(auth.props.apikey);
    return { disabled: false, options: items };
  } catch {
    return {
      disabled: true,
      options: [],
      placeholder: 'Could not load the list. Check your connection.',
    };
  }
};

export const createBuildProperty = () => Property.ShortText({
  displayName: 'Build',
  description: 'Build tag or number to run. Empty: the default build.',
  placeholder: 'latest',
  required: false,
  advanced: true,
});

export const createMemoryProperty = (runType: RunType) => Property.StaticDropdown({
  displayName: 'Memory',
  description: runType === RunType.ACTOR
    ? "Empty: the Actor's default memory."
    : 'Empty: the memory set in the task.',
  required: false,
  advanced: true,
  options: {
    options: MEMORY_OPTIONS
  }
});

export const createTimeoutProperty = (runType: RunType) => Property.Number({
  displayName: 'Timeout',
  required: false,
  advanced: true,
  description: runType === RunType.ACTOR
    ? "Seconds before the run is stopped. Empty: the Actor's default."
    : "Seconds before the run is stopped. Empty: the task's setting."
});

export const createWaitForFinishProperty = () => Property.Checkbox({
  displayName: 'Wait for Finish',
  description: "On: waits and returns the run's dataset items. Off: only starts it.",
  required: false,
  defaultValue: true,
});

// Create run options from input props
export const createRunOptions = (input: {
  timeout?: number | null;
  memory?: number | null;
  build?: string | null;
}): { timeout?: number; memory?: number; build?: string; } => {
  const options: { timeout?: number; memory?: number; build?: string; } = {};

  if (input.timeout != null) options.timeout = input.timeout;
  if (input.memory != null) options.memory = input.memory;
  if (input.build) options.build = input.build;

  return options;
};

// Handle run based on the wait for finish property
export const handleRun = async (
  {
    resourceClient,
    body,
    runOptions,
    waitForFinish,
    client
  }: {
    resourceClient: ActorClient | TaskClient;
    // Optional: when undefined, the Apify client uses the task's saved input
    // instead of overriding it with an empty object.
    body?: Dictionary;
    runOptions: { timeout?: number; memory?: number; build?: string; };
    waitForFinish: boolean;
    client: ApifyClient;
  }
): Promise<{ run: any; datasetItems: any; }> => {
  const run = waitForFinish
    ? await resourceClient.call(body, runOptions)
    : await resourceClient.start(body, runOptions);

  if (waitForFinish && run.defaultDatasetId) {
    const datasetItems = await client.dataset(run.defaultDatasetId).listItems();
    return {
      run,
      datasetItems: datasetItems.items
    };
  }

  return {
    run,
    datasetItems: null
  };
};

export const createActorSourceProperty = () => Property.StaticDropdown({
  required: true,
  displayName: 'Actor Source',
  description: 'Your recently run Actors, or any public Actor in the Apify Store.',
  defaultValue: 'recent',
  display: 'cards',
  options: {
    options: [{
      label: 'Recently Used',
      value: 'recent',
    }, {
      label: 'Apify Store',
      value: 'store',
    }]
  }
});

export const createActorIdProperty = () => Property.Dropdown({
  displayName: 'Actor',
  auth: apifyAuth,
  description: 'Type to search by name.',
  required: true,
  refreshers: ['auth', 'actorSource'],
  refreshOnSearch: true,
  options: async (props, { searchValue }) => {
    const actorSource = typeof props['actorSource'] === 'string' ? props['actorSource'] : undefined;
    return createDropdownOptions(props['auth'], (apiKey) => listActors({ apiKey, actorSource, search: searchValue }));
  }
});

export const createTaskIdProperty = () => Property.Dropdown({
  displayName: 'Task',
  auth: apifyAuth,
  description: 'A saved task from your Apify account.',
  required: true,
  refreshers: ['auth'],
  options: async (props) => {
    return createDropdownOptions(props['auth'], listTasks);
  }
});

const createInputBodyProperty = (runType: RunType, defaultValue?: object) => Property.Json({
  displayName: `${runType === RunType.ACTOR ? '' : 'Override '}Input JSON`,
  description: runType === RunType.ACTOR
    ? 'The JSON the Actor gets, prefilled from its defaults when available.'
    : "Fields here replace the same fields in the task's saved input.",
  required: true,
  defaultValue
});

export const createActorInputProperty = () => Property.DynamicProperties({
  displayName: 'Input',
  auth: apifyAuth,
  required: true,
  refreshers: ['auth', 'actorid'],
  props: async (propsValue) => {
    const auth = propsValue['auth'] as ApifyAuth | undefined;
    const actorId = propsValue['actorid'] as unknown as string | undefined;

    if (!auth?.props?.apikey || !actorId) {
      return {
        body: createInputBodyProperty(RunType.ACTOR)
      };
    }

    let defaultInputs: Dictionary | undefined;
    try {
      const defaultBuild = await fetchActorInputSchema(auth.props.apikey, actorId);
      defaultInputs = defaultBuild ? getDefaultValuesFromBuild(defaultBuild as ActorBuild) : undefined;
    } catch {
      defaultInputs = undefined;
    }

    return {
      body: createInputBodyProperty(
        RunType.ACTOR,
        defaultInputs
      )
    };
  }
});

export const createTaskInputProperty = () => Property.DynamicProperties({
  displayName: 'Input',
  auth: apifyAuth,
  required: true,
  refreshers: ['auth', 'taskid'],
  props: async () => {
    return {
      body: createInputBodyProperty(
        RunType.TASK,
        {},
      )
    };
  }
});

export const createWebhook = async (
  client: ApifyClient,
  eventTypes: WebhookEventType[],
  condition: WebhookCondition,
  webhookUrl: string,
  idempotencyKey: string,
): Promise<string> => {
  try {
    const webhook = await client.webhooks().create({
      eventTypes,
      condition,
      requestUrl: webhookUrl,
      idempotencyKey,
    });
    return webhook.id;
  } catch (error: any) {
    throw new Error(`Failed to create a webhook. Reason: ${error.message}`);
  }
};

export const deleteWebhook = async (
  client: ApifyClient,
  webhookId: string,
): Promise<void> => {
  try {
    await client.webhook(webhookId).delete();
  } catch (error: any) {
    throw new Error(`Failed to delete the webhook. Reason: ${error.message}`);
  }
};

export const generateIdempotencyKey = (
  id: string,
  eventTypes: WebhookEventType[],
  webhookUrl: string,
): string => {
  const sortedEventTypes = [...eventTypes].sort();
  const hash = createHash('sha256');
  hash.update(`${id}:${sortedEventTypes.join(',')}:${webhookUrl}`);
  return hash.digest('hex');
};

export const createStatusesProperty = () => Property.StaticMultiSelectDropdown({
  displayName: 'Statuses',
  description: 'Run outcomes that start the flow.',
  required: true,
  defaultValue: TERMINAL_STATUSES,
  options: {
    options: STATUS_OPTIONS,
  },
});

export const createWebhookInfoProperty = () => Property.MarkDown({
  value: 'Turning this flow on creates a webhook in your Apify account. Turning it off removes it.',
});

export const createWebhookSampleData = (runType: RunType) => ({
  userId: 'wRsJZtadYvn4mBZmm',
  createdAt: '2019-12-12T07:34:14.202Z',
  eventType: 'ACTOR.RUN.SUCCEEDED',
  eventData: {
    actorId: 'vvE7iMKuMc5qTHHsR',
    actorTaskId: runType === RunType.ACTOR ? undefined : "FThsabHGXorVhWbPV",
    actorRunId: 'JgwXN9BdwxGcu9MMF',
  },
  resource: {
    id: "RHQcmK6J61lSuqwert",
    actId: "nFJndFXA5zjCTuudP",
    startedAt: "2025-10-30T11:30:34.985Z",
    finishedAt: "2025-10-30T11:30:41.352Z",
    status: "SUCCEEDED",
    isStatusMessageTerminal: true,
    defaultKeyValueStoreId: "eJNzqsbPiopwJcgGQ",
    defaultDatasetId: "wmKPijuyDnPZAPRMk",
    defaultRequestQueueId: "FL35cSF7jrxr3BY39",
  },
});

function isApifyAuth(auth: unknown): auth is ApifyAuth {
  if (typeof auth !== 'object' || auth === null || !('props' in auth)) {
    return false;
  }
  const { props } = auth;
  return typeof props === 'object' && props !== null && 'apikey' in props && typeof props.apikey === 'string';
}
