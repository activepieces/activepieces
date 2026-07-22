import { OutputSchema } from '@activepieces/pieces-framework';

const actorRunFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Run ID' },
  { key: 'actId', label: 'Actor ID' },
  { key: 'status', label: 'Status' },
  { key: 'startedAt', label: 'Started At', format: 'datetime' },
  { key: 'finishedAt', label: 'Finished At', format: 'datetime' },
  { key: 'buildNumber', label: 'Build Number' },
  { key: 'exitCode', label: 'Exit Code' },
  { key: 'defaultDatasetId', label: 'Dataset ID' },
  { key: 'defaultKeyValueStoreId', label: 'Key-Value Store ID' },
  { key: 'defaultRequestQueueId', label: 'Request Queue ID' },
  { key: 'usageTotalUsd', label: 'Usage (USD)', format: 'currency', currency: 'USD' },
  { key: 'containerUrl', label: 'Container URL', format: 'url' },
  { key: 'consoleUrl', label: 'Console URL', format: 'url' },
];

export const runActorActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'run', label: 'Run', children: actorRunFields },
    { key: 'datasetItems', label: 'Dataset Items' },
  ],
};

export const runTaskActionOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'run',
      label: 'Run',
      children: [
        { key: 'actorTaskId', label: 'Task ID' },
        ...actorRunFields,
      ],
    },
    { key: 'datasetItems', label: 'Dataset Items' },
  ],
};

export const getDatasetItemsActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'items', label: 'Items' },
    { key: 'count', label: 'Count', format: 'number' },
    { key: 'total', label: 'Total', format: 'number' },
    { key: 'offset', label: 'Offset', format: 'number' },
    { key: 'limit', label: 'Limit', format: 'number' },
    { key: 'datasetId', label: 'Dataset ID' },
  ],
};

export const getKeyValueStoreRecordActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'key', label: 'Record Key' },
    { key: 'value', label: 'Value' },
    { key: 'file', label: 'File URL', format: 'url' },
    { key: 'fileName', label: 'File Name' },
    { key: 'size', label: 'File Size', format: 'filesize' },
    { key: 'contentType', label: 'Content Type' },
    { key: 'dataType', label: 'Data Type' },
  ],
};

export const scrapeUrlActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'url', label: 'URL', format: 'url' },
    { key: 'markdown', label: 'Markdown' },
    { key: 'html', label: 'HTML', format: 'html' },
  ],
};

export const getAccountActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'User ID' },
    { key: 'username', label: 'Username' },
    { key: 'email', label: 'Email', format: 'email' },
    {
      key: 'profile',
      label: 'Profile',
      children: [{ key: 'name', label: 'Name' }],
    },
    {
      key: 'plan',
      label: 'Plan',
      children: [
        { key: 'id', label: 'Plan ID' },
        { key: 'tier', label: 'Tier' },
      ],
    },
    { key: 'createdAt', label: 'Created At', format: 'datetime' },
    { key: 'isPaying', label: 'Is Paying', format: 'boolean' },
  ],
};

export const getAccountLimitsActionOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'monthlyUsageCycle',
      label: 'Monthly Usage Cycle',
      children: [
        { key: 'startAt', label: 'Start At', format: 'datetime' },
        { key: 'endAt', label: 'End At', format: 'datetime' },
      ],
    },
    {
      key: 'limits',
      label: 'Plan Limits',
      children: [
        { key: 'maxMonthlyUsageUsd', label: 'Max Monthly Usage (USD)', format: 'currency', currency: 'USD' },
        { key: 'maxMonthlyActorComputeUnits', label: 'Max Monthly Compute Units', format: 'number' },
        { key: 'maxActorMemoryGbytes', label: 'Max Actor Memory (GB)', format: 'number' },
        { key: 'maxActorCount', label: 'Max Actor Count', format: 'number' },
        { key: 'maxActorTaskCount', label: 'Max Task Count', format: 'number' },
        { key: 'maxConcurrentActorJobs', label: 'Max Concurrent Runs', format: 'number' },
        { key: 'dataRetentionDays', label: 'Data Retention (Days)', format: 'number' },
      ],
    },
    {
      key: 'current',
      label: 'Current Usage',
      children: [
        { key: 'monthlyUsageUsd', label: 'Monthly Usage (USD)', format: 'currency', currency: 'USD' },
        { key: 'monthlyActorComputeUnits', label: 'Monthly Compute Units', format: 'number' },
        { key: 'actorCount', label: 'Actor Count', format: 'number' },
        { key: 'actorTaskCount', label: 'Task Count', format: 'number' },
        { key: 'activeActorJobCount', label: 'Active Runs', format: 'number' },
      ],
    },
  ],
};

export const getActorActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'Actor ID' },
    { key: 'name', label: 'Name' },
    { key: 'username', label: 'Username' },
    { key: 'title', label: 'Title' },
    { key: 'description', label: 'Description' },
    { key: 'isPublic', label: 'Is Public', format: 'boolean' },
    { key: 'isDeprecated', label: 'Is Deprecated', format: 'boolean' },
    { key: 'createdAt', label: 'Created At', format: 'datetime' },
    { key: 'modifiedAt', label: 'Modified At', format: 'datetime' },
    {
      key: 'stats',
      label: 'Stats',
      children: [
        { key: 'totalRuns', label: 'Total Runs', format: 'number' },
        { key: 'totalUsers', label: 'Total Users', format: 'number' },
      ],
    },
    {
      key: 'defaultRunOptions',
      label: 'Default Run Options',
      children: [
        { key: 'build', label: 'Build' },
        { key: 'memoryMbytes', label: 'Memory (MB)', format: 'number' },
        { key: 'timeoutSecs', label: 'Timeout (s)', format: 'number' },
      ],
    },
    { key: 'categories', label: 'Categories' },
    { key: 'pictureUrl', label: 'Picture', format: 'image' },
  ],
};

export const getActorRunActionOutputSchema: OutputSchema = {
  fields: actorRunFields,
};

export const getBuildActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'Build ID' },
    { key: 'actId', label: 'Actor ID' },
    { key: 'status', label: 'Status' },
    { key: 'startedAt', label: 'Started At', format: 'datetime' },
    { key: 'finishedAt', label: 'Finished At', format: 'datetime' },
    { key: 'buildNumber', label: 'Build Number' },
    { key: 'exitCode', label: 'Exit Code' },
    { key: 'usageTotalUsd', label: 'Usage (USD)', format: 'currency', currency: 'USD' },
  ],
};

export const getDatasetActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'Dataset ID' },
    { key: 'name', label: 'Name' },
    { key: 'itemCount', label: 'Item Count', format: 'number' },
    { key: 'cleanItemCount', label: 'Clean Item Count', format: 'number' },
    { key: 'createdAt', label: 'Created At', format: 'datetime' },
    { key: 'modifiedAt', label: 'Modified At', format: 'datetime' },
    { key: 'actId', label: 'Actor ID' },
    { key: 'actRunId', label: 'Run ID' },
    { key: 'fields', label: 'Fields' },
    { key: 'consoleUrl', label: 'Console URL', format: 'url' },
  ],
};

export const getKeyValueStoreActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'Key-Value Store ID' },
    { key: 'name', label: 'Name' },
    { key: 'createdAt', label: 'Created At', format: 'datetime' },
    { key: 'modifiedAt', label: 'Modified At', format: 'datetime' },
    { key: 'actId', label: 'Actor ID' },
    { key: 'actRunId', label: 'Run ID' },
    { key: 'consoleUrl', label: 'Console URL', format: 'url' },
  ],
};

export const getTaskActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'Task ID' },
    { key: 'name', label: 'Name' },
    { key: 'title', label: 'Title' },
    { key: 'actId', label: 'Actor ID' },
    { key: 'username', label: 'Username' },
    { key: 'createdAt', label: 'Created At', format: 'datetime' },
    { key: 'modifiedAt', label: 'Modified At', format: 'datetime' },
    {
      key: 'stats',
      label: 'Stats',
      children: [{ key: 'totalRuns', label: 'Total Runs', format: 'number' }],
    },
    {
      key: 'options',
      label: 'Options',
      children: [{ key: 'memoryMbytes', label: 'Memory (MB)', format: 'number' }],
    },
    { key: 'input', label: 'Input' },
  ],
};

export const getTaskLastRunActionOutputSchema: OutputSchema = {
  fields: [{ key: 'actorTaskId', label: 'Task ID' }, ...actorRunFields],
};

export const getLastActorRunActionOutputSchema: OutputSchema = {
  fields: actorRunFields,
};

export const listActorsActionOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'actors',
      label: 'Actors',
      labelKey: 'fullName',
      listItems: [
        { key: 'id', label: 'Actor ID' },
        { key: 'name', label: 'Name' },
        { key: 'username', label: 'Username' },
        { key: 'fullName', label: 'Full Name' },
        { key: 'createdAt', label: 'Created At', format: 'datetime' },
        { key: 'modifiedAt', label: 'Modified At', format: 'datetime' },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
    { key: 'total', label: 'Total', format: 'number' },
  ],
};

export const listDatasetsActionOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'datasets',
      label: 'Datasets',
      labelKey: 'name',
      listItems: [
        { key: 'id', label: 'Dataset ID' },
        { key: 'name', label: 'Name' },
        { key: 'title', label: 'Title' },
        { key: 'itemCount', label: 'Item Count', format: 'number' },
        { key: 'createdAt', label: 'Created At', format: 'datetime' },
        { key: 'modifiedAt', label: 'Modified At', format: 'datetime' },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
    { key: 'total', label: 'Total', format: 'number' },
  ],
};

export const listKeyValueStoresActionOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'stores',
      label: 'Key-Value Stores',
      labelKey: 'name',
      listItems: [
        { key: 'id', label: 'Store ID' },
        { key: 'name', label: 'Name' },
        { key: 'title', label: 'Title' },
        { key: 'createdAt', label: 'Created At', format: 'datetime' },
        { key: 'modifiedAt', label: 'Modified At', format: 'datetime' },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
    { key: 'total', label: 'Total', format: 'number' },
  ],
};

export const listTasksActionOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'tasks',
      label: 'Tasks',
      labelKey: 'name',
      listItems: [
        { key: 'id', label: 'Task ID' },
        { key: 'name', label: 'Name' },
        { key: 'title', label: 'Title' },
        { key: 'actId', label: 'Actor ID' },
        { key: 'username', label: 'Username' },
        { key: 'createdAt', label: 'Created At', format: 'datetime' },
        { key: 'modifiedAt', label: 'Modified At', format: 'datetime' },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
    { key: 'total', label: 'Total', format: 'number' },
  ],
};

const runSummaryFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Run ID' },
  { key: 'actId', label: 'Actor ID' },
  { key: 'actorTaskId', label: 'Task ID' },
  { key: 'status', label: 'Status' },
  { key: 'startedAt', label: 'Started At', format: 'datetime' },
  { key: 'finishedAt', label: 'Finished At', format: 'datetime' },
  { key: 'buildNumber', label: 'Build Number' },
  { key: 'defaultDatasetId', label: 'Dataset ID' },
  { key: 'defaultKeyValueStoreId', label: 'Key-Value Store ID' },
  { key: 'usageTotalUsd', label: 'Usage (USD)', format: 'currency', currency: 'USD' },
];

export const listActorRunsActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'runs', label: 'Runs', labelKey: 'status', listItems: runSummaryFields },
    { key: 'count', label: 'Count', format: 'number' },
    { key: 'total', label: 'Total', format: 'number' },
    { key: 'actorId', label: 'Actor ID' },
  ],
};

export const listRunsActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'runs', label: 'Runs', labelKey: 'status', listItems: runSummaryFields },
    { key: 'count', label: 'Count', format: 'number' },
    { key: 'total', label: 'Total', format: 'number' },
  ],
};

export const findActorActionOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'actors',
      label: 'Actors',
      labelKey: 'fullName',
      listItems: [
        { key: 'id', label: 'Actor ID' },
        { key: 'name', label: 'Name' },
        { key: 'username', label: 'Username' },
        { key: 'title', label: 'Title' },
        { key: 'fullName', label: 'Full Name' },
        { key: 'description', label: 'Description' },
        {
          key: 'stats',
          label: 'Stats',
          children: [
            { key: 'totalRuns', label: 'Total Runs', format: 'number' },
            { key: 'totalUsers', label: 'Total Users', format: 'number' },
            { key: 'actorReviewRating', label: 'Rating', format: 'number' },
            { key: 'bookmarkCount', label: 'Bookmarks', format: 'number' },
          ],
        },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
    { key: 'total', label: 'Total', format: 'number' },
  ],
};

export const getActorInputSchemaActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'actorId', label: 'Actor ID' },
    { key: 'buildId', label: 'Build ID' },
    { key: 'buildNumber', label: 'Build Number' },
    { key: 'input', label: 'Input Schema' },
  ],
};

export const getTaskInputActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'taskId', label: 'Task ID' },
    { key: 'input', label: 'Input' },
  ],
};

export const getRunDatasetItemsActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'items', label: 'Items' },
    { key: 'count', label: 'Count', format: 'number' },
    { key: 'total', label: 'Total', format: 'number' },
    { key: 'offset', label: 'Offset', format: 'number' },
    { key: 'limit', label: 'Limit', format: 'number' },
    { key: 'runId', label: 'Run ID' },
  ],
};

export const getActorLastRunDatasetItemsActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'items', label: 'Items' },
    { key: 'count', label: 'Count', format: 'number' },
    { key: 'total', label: 'Total', format: 'number' },
    { key: 'offset', label: 'Offset', format: 'number' },
    { key: 'limit', label: 'Limit', format: 'number' },
    { key: 'actorId', label: 'Actor ID' },
  ],
};

export const getTaskLastRunDatasetItemsActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'items', label: 'Items' },
    { key: 'count', label: 'Count', format: 'number' },
    { key: 'total', label: 'Total', format: 'number' },
    { key: 'offset', label: 'Offset', format: 'number' },
    { key: 'limit', label: 'Limit', format: 'number' },
    { key: 'taskId', label: 'Task ID' },
  ],
};

export const getRunLogActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'Run/Build ID' },
    { key: 'log', label: 'Log' },
  ],
};

export const abortActorRunActionOutputSchema: OutputSchema = {
  fields: actorRunFields,
};

export const createTaskActionOutputSchema: OutputSchema = getTaskActionOutputSchema;

export const updateTaskInputActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'taskId', label: 'Task ID' },
    { key: 'input', label: 'Input' },
  ],
};

export const listKeyValueStoreKeysActionOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'keys',
      label: 'Keys',
      labelKey: 'key',
      listItems: [
        { key: 'key', label: 'Key' },
        { key: 'size', label: 'Size', format: 'filesize' },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
    { key: 'isTruncated', label: 'Is Truncated', format: 'boolean' },
    { key: 'nextExclusiveStartKey', label: 'Next Start Key' },
    { key: 'storeId', label: 'Store ID' },
  ],
};
