import { createAction, Property } from '@activepieces/pieces-framework';
import { crawlsnapAuth } from './auth';
import { crawlsnapGet } from './client';

/**
 * Builds a single-`query` CrawlSnap lookup action. Every VectorSnap / PulseSnap
 * operation is a GET that takes one indicator and returns the unwrapped `data`,
 * so they only differ by name, label, copy, and path.
 */
export function createLookupAction(opts: {
  name: string;
  displayName: string;
  description: string;
  queryDescription: string;
  path: string;
}) {
  return createAction({
    auth: crawlsnapAuth,
    name: opts.name,
    displayName: opts.displayName,
    description: opts.description,
    props: {
      query: Property.ShortText({
        displayName: 'Query',
        description: opts.queryDescription,
        required: true,
      }),
    },
    async run({ auth, propsValue }) {
      return crawlsnapGet(auth, opts.path, { query: propsValue.query });
    },
  });
}
