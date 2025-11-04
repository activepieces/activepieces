import { ActorListSortBy, ApifyClient, Build, Dictionary } from 'apify-client';
import { Property } from '@activepieces/pieces-framework';

export type ApifyAuth = {
  apikey: string;
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
  const build = defaultBuild.get();

  return build;
};

export const fetchTaskInputSchema = async (apiKey: string, taskId: string): Promise<Dictionary | Dictionary[] | undefined> => {
  const client = createApifyClient(apiKey);
  const inputSchema = await client.task(taskId).getInput();
  return inputSchema;
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
    const items = await fetchItems(apifyAuth.apikey);
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
  defaultValue: 'latest',
  required: false
});

export const createMemoryProperty = (description: string) => Property.StaticDropdown({
  displayName: 'Memory',
  description,
  required: false,
  options: {
    options: MEMORY_OPTIONS
  }
});

export const createTimeoutProperty = (description: string) => Property.Number({
  displayName: 'Timeout (seconds)',
  required: false,
  description
});

export const createWaitForFinishProperty = (description: string) => Property.Checkbox({
  displayName: 'Wait for finish',
  description,
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

// Handle run result based on the wait for finish property
export const handleRunResult = async (
  run: any,
  waitForFinish: boolean,
  client: any
): Promise<{ run: any; items: any; }> => {
  if (waitForFinish && run.defaultDatasetId) {
    const items = await client.dataset(run.defaultDatasetId).get();
    return {
      run,
      items
    };
  }

  return {
    run,
    items: null
  };
}
