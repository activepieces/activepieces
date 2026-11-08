import { createAction, Property } from '@activepieces/pieces-framework';
import { rendexAuth } from '../common/auth';
import { rendexClient } from '../common/client';
import { RENDEX_LIMITS, rendexInput } from '../common/common';
import { rendexProps } from '../common/props';
import { listWatchesOutputSchema } from '../common/output-schemas';

const STATUS_OPTIONS = [
  { label: 'All', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Paused', value: 'paused' },
];

export const listWatches = createAction({
  auth: rendexAuth,
  name: 'list_watches',
  classification: 'SEARCH',
  displayName: 'List Watches',
  description: 'List your website change watches, one page at a time.',
  audience: 'both',
  aiMetadata: {
    description:
      'Lists your Rendex watches (monitored pages) with their id, URL, name, status and schedule, one page at a time; filter by active or paused. Returns nextCursor and hasMore: pass nextCursor back as Cursor to read the next page. Use it to find the Watch ID for Get Watch, Update Watch, Run Watch Check Now, List Watch Runs or Delete Watch. Read-only and safe to retry.',
    idempotent: true,
  },
  outputSchema: listWatchesOutputSchema,
  props: {
    status: rendexProps.choice({ displayName: 'Status', description: 'Only watches in this state. Default all.', values: STATUS_OPTIONS }),
    limit: Property.Number({ displayName: 'Limit', description: 'Watches per page, 1 to 100. Default 20.', required: false }),
    cursor: Property.ShortText({ displayName: 'Cursor', description: 'The Next Cursor from a previous List Watches run, to get the next page.', required: false }),
  },
  async run(context) {
    const { status, limit, cursor } = context.propsValue;
    return rendexClient.listPage({
      auth: context.auth,
      path: '/v1/watches',
      query: {
        status: rendexInput.choiceOf({ value: status, label: 'Status', allowed: STATUS_OPTIONS.map((option) => option.value) }),
        limit: rendexInput.numberOf({ value: limit, ...RENDEX_LIMITS.LIMIT }),
        cursor: rendexInput.optionalText(cursor),
      },
      operation: 'list your watches',
    });
  },
});
