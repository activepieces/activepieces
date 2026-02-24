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

export const STATUS_OPTIONS = [
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

export const listActors = async (apiKey: string, actorSource: string): Promise<DropdownOption[]> => {
  const client = createApifyClient(apiKey);

  try {
    if (actorSource === 'recent') {
      const recentActors = await client.actors().list({
        offset: 0,
        sortBy: ActorListSortBy.LAST_RUN_STARTED_AT,
        desc: true,
        limit: 1000,
      });
      return recentActors.items.map(mapActorToDropdownOption);
    }

    const storeActors = await client.store().list({
      limit: 1000,
      offset: 0,
    });
    return storeActors.items.map(mapActorToDropdownOption);
  } catch (error: any) {
    return [
      { label: `Failed to load actors: ${error.message || error}`, value: '' },
    ];
  }
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

  try {
    const tasks = await client.tasks().list({
      limit: 1000,
      offset: 0,
    });
    return tasks.items.map(mapTaskToDropdownOption);
  } catch (error: any) {
    return [
      { label: `Failed to load tasks: ${error.message || error}`, value: '' },
    ];
  }
};

export const listDatasets = async (apiKey: string): Promise<DropdownOption[]> => {
  const client = createApifyClient(apiKey);

  try {
    const dataset = await client.datasets().list({
      desc: true,
    });

    return dataset.items.map(item => ({
      value: item.id,
      label: `${item.title || item.name} (${item.itemCount} ${pluralize(item.itemCount)} - ${item.id})`
    }));
  } catch (error: any) {
    return [{ label: `Failed to load datasets: ${error.message || error}`, value: '' }];
  }
};

export const listStores = async (apiKey: string): Promise<DropdownOption[]> => {
  const client = createApifyClient(apiKey);

  try {
    const stores = await client.keyValueStores().list({
      desc: true
    });

    return stores.items.map(item => ({
      value: item.id,
      label: item.title! || item.name!
    }));
  } catch (error: any) {
    return [{ label: `Failed to load Key-Value store list: ${error.message || error}`, value: '' }];
  }
};

export const listRecords = async (apiKey: string, storeId: string): Promise<DropdownOption[]> => {
  const client = createApifyClient(apiKey);

  try {
    const records = await client.keyValueStore(storeId).listKeys();

    return records.items.map(item => ({
      value: item.key,
      label: item.key
    }));
  } catch (error: any) {
    return [{ label: `Failed to fetch keys for store "${storeId}". Reason: ${error.message}`, value: '' }];
  }
};

export const pluralize = (n: number): string => n === 1 ? "item" : "items";

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


// Create dropdown options for a list of items
export const createDropdownOptions = async (
  auth: unknown,
  fetchItems: (apiKey: string) => Promise<DropdownOption[]>
): Promise<{ disabled: boolean; options: DropdownOption[]; }> => {
  if (!auth) {
    return {
      disabled: true,
      options: [],
    };
  }

  try {
    const apifyAuth = auth as ApifyAuth;
    const items = await fetchItems(apifyAuth.props.apikey);
    return { disabled: false, options: items };
  } catch (error) {
    return {
      disabled: true,
      options: [],
    };
  }
};

export const createBuildProperty = () => Property.ShortText({
  displayName: 'Build',
  description: 'Build to run. It can be either a build tag or build number. By default, the run uses the build specified in the default run configuration (typically `latest`).',
  required: false
});

export const createMemoryProperty = (runType: RunType) => Property.StaticDropdown({
  displayName: 'Memory',
  description: `Memory limit for the run, in megabytes. The amount of memory can be set to one of the available options. By default, the run uses a memory limit specified in the ${runType === RunType.ACTOR ? 'default run configuration for the Actor' : 'task settings'}.`,
  required: false,
  options: {
    options: MEMORY_OPTIONS
  }
});

export const createTimeoutProperty = (runType: RunType) => Property.Number({
  displayName: 'Timeout (seconds)',
  required: false,
  description: `Optional timeout for the run, in seconds. By default, the run uses a timeout specified in the ${runType === RunType.ACTOR ? 'default run configuration for the Actor' : 'task settings'}.`
});

export const createWaitForFinishProperty = (runType: RunType) => Property.Checkbox({
  displayName: 'Wait for finish',
  description: `If enabled, the step waits for the ${runType} run to finish and returns the run’s dataset items as the step output.`,
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
    body: Dictionary;
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
  defaultValue: 'recent',
  options: {
    options: [{
      label: 'Recently Used Actors',
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
  description: 'Select an Actor from the list.',
  required: true,
  refreshers: ['auth', 'actorSource'],
  options: async (props) => {
    const actorSource = props['actorSource'] as string;
    return createDropdownOptions(props['auth'], (apiKey) => listActors(apiKey, actorSource));
  }
});

export const createTaskIdProperty = () => Property.Dropdown({
  displayName: 'Actor Task',
  auth: apifyAuth,
  description: 'Select a task from the list.',
  required: true,
  refreshers: ['auth'],
  options: async (props) => {
    return createDropdownOptions(props['auth'], listTasks);
  }
});

const createInputBodyProperty = (runType: RunType, defaultValue?: object) => Property.Json({
  displayName: `${runType === RunType.ACTOR ? '' : 'Override '}Input JSON`,
  description: `JSON input for the ${runType} run, which you can find on the ${runType} input page in Apify Console. If empty, the run uses the input specified in the default run configuration.`,
  required: true,
  defaultValue
});

export const createActorInputProperty = () => Property.DynamicProperties({
  displayName: 'Input',
  auth: apifyAuth,
  required: true,
  refreshers: ['auth', 'actorid'],
  props: async (propsValue) => {
    const apiKey = propsValue['auth'] as ApifyAuth;
    const actorId = propsValue['actorid'] as unknown as string;
    const defaultBuild = await fetchActorInputSchema(apiKey.props.apikey, actorId);

    const defaultInputs = defaultBuild ? getDefaultValuesFromBuild(defaultBuild as ActorBuild) : undefined;

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
): string => {
  const sortedEventTypes = [...eventTypes].sort();
  const hash = createHash('sha256');
  hash.update(`${id}:${sortedEventTypes.join(',')}`);
  return hash.digest('hex');
};

export const createStatusesProperty = () => Property.StaticMultiSelectDropdown({
  displayName: 'Statuses',
  description: 'Run statuses to watch.',
  required: true,
  defaultValue: TERMINAL_STATUSES,
  options: {
    options: STATUS_OPTIONS,
  },
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
