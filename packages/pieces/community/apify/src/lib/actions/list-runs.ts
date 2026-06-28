import { createAction, Property } from '@activepieces/pieces-framework';
import { apifyAuth } from '../..';
import { createApifyClient } from '../common';

const RUN_STATUS_OPTIONS = [
  { label: 'Ready', value: 'READY' },
  { label: 'Running', value: 'RUNNING' },
  { label: 'Succeeded', value: 'SUCCEEDED' },
  { label: 'Failed', value: 'FAILED' },
  { label: 'Timing Out', value: 'TIMING-OUT' },
  { label: 'Timed Out', value: 'TIMED-OUT' },
  { label: 'Aborting', value: 'ABORTING' },
  { label: 'Aborted', value: 'ABORTED' },
];

export const apifyListRuns = createAction({
  name: 'apify_list_runs',
  auth: apifyAuth,
  displayName: 'List Runs',
  description: 'Lists Actor runs across the whole account.',
  audience: 'ai',
  aiMetadata: {
    description:
      'List Actor runs across the entire account, newest first, optionally filtered by status. Use this when you do not know which actor produced a run; use List Actor Runs to scope to a single actor. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    status: Property.StaticDropdown({
      displayName: 'Status',
      description: 'Optionally filter runs by status.',
      required: false,
      options: { options: RUN_STATUS_OPTIONS },
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of runs to return. Default 50.',
      required: false,
      defaultValue: 50,
    }),
    offset: Property.Number({
      displayName: 'Offset',
      description: 'Number of runs to skip at the start. Default 0.',
      required: false,
      defaultValue: 0,
    }),
  },
  async run(context) {
    const apifyToken = context.auth.props.apikey;
    const { status, limit, offset } = context.propsValue;

    const client = createApifyClient(apifyToken);

    try {
      const response = await client.runs().list({
        status: status ? (status as any) : undefined,
        desc: true,
        limit: limit ?? 50,
        offset: offset ?? 0,
      });

      return {
        runs: response.items,
        count: response.items.length,
        total: response.total,
      };
    } catch (error: any) {
      if (error.statusCode === 403) {
        throw new Error('Permission denied listing runs.');
      }
      if (error.statusCode === 429) {
        throw new Error('Apify rate limit exceeded. Retry after a short delay.');
      }
      throw new Error(`Failed to list runs: ${error.message || error}`);
    }
  },
});
