import { Property } from '@activepieces/pieces-framework';

function subreddit<R extends boolean>({ required, description }: { required: R; description?: string }) {
  return Property.ShortText({
    displayName: 'Subreddit',
    description: description ?? 'Subreddit name without the r/ prefix (e.g. "programming").',
    required,
  });
}

function username({ description }: { description?: string }) {
  return Property.ShortText({
    displayName: 'Username',
    description: description ?? 'Reddit username without the u/ prefix.',
    required: true,
  });
}

function limit() {
  return Property.Number({
    displayName: 'Limit',
    description: 'Maximum number of items to return (1-100, default 25).',
    required: false,
  });
}

function after() {
  return Property.ShortText({
    displayName: 'After',
    description: 'Pagination cursor: pass the `after` value from the previous response to get the next page.',
    required: false,
  });
}

function timeFilter() {
  return Property.StaticDropdown({
    displayName: 'Time Range',
    description: 'Time window for "top" and "controversial" sorts.',
    required: false,
    options: {
      options: [
        { label: 'Past Hour', value: 'hour' },
        { label: 'Past 24 Hours', value: 'day' },
        { label: 'Past Week', value: 'week' },
        { label: 'Past Month', value: 'month' },
        { label: 'Past Year', value: 'year' },
        { label: 'All Time', value: 'all' },
      ],
    },
  });
}

function optionalBoolean({ displayName, description }: { displayName: string; description: string }) {
  return Property.StaticDropdown({
    displayName,
    description,
    required: false,
    options: {
      options: [
        { label: 'Yes', value: 'true' },
        { label: 'No', value: 'false' },
      ],
    },
  });
}

function clampLimit({ value }: { value: number | undefined }): number | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }
  return Math.min(Math.max(Math.trunc(value), 1), 100);
}

export const redditAiProps = {
  subreddit,
  username,
  limit,
  after,
  timeFilter,
  optionalBoolean,
  clampLimit,
};
