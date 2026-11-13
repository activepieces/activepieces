import { createAction, Property } from '@activepieces/pieces-framework';
import { rendexAuth } from '../common/auth';
import { rendexClient } from '../common/client';
import { RENDEX_LIMITS, rendexInput } from '../common/common';
import { rendexProps } from '../common/props';
import { listWatchRunsOutputSchema } from '../common/output-schemas';

export const listWatchRuns = createAction({
  auth: rendexAuth,
  name: 'list_watch_runs',
  classification: 'SEARCH',
  displayName: 'List Watch Runs',
  description: 'List the checks of a website change watch, newest first, with what changed.',
  audience: 'both',
  aiMetadata: {
    description:
      'Lists the checks of one Rendex watch, newest first: status, whether the page changed, diff score, before/after/overlay image links, text changes and errors. Returns nextCursor and hasMore: pass nextCursor back as Cursor for older runs. Use it after Run Watch Check Now to read the result. Read-only and safe to retry.',
    idempotent: true,
  },
  outputSchema: listWatchRunsOutputSchema,
  props: {
    watch_id: rendexProps.watchDropdown(),
    limit: Property.Number({ displayName: 'Limit', description: 'Runs per page, 1 to 100. Default 20.', required: false }),
    cursor: Property.ShortText({ displayName: 'Cursor', description: 'The Next Cursor from a previous List Watch Runs run, to get older runs.', required: false }),
  },
  async run(context) {
    const { watch_id, limit, cursor } = context.propsValue;
    return rendexClient.listPage({
      auth: context.auth,
      path: `/v1/watches/${rendexClient.segment({ value: watch_id, label: 'Watch' })}/runs`,
      query: {
        limit: rendexInput.numberOf({ value: limit, ...RENDEX_LIMITS.LIMIT }),
        cursor: rendexInput.optionalText(cursor),
      },
      operation: 'list the watch runs',
    });
  },
});
