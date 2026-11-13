import { createAction, Property } from '@activepieces/pieces-framework';
import { workableAuth } from '../auth';
import { workableOps } from '../common/operations';
import { accountSubdomainProp } from '../common/props';
import { workableSchemas } from '../common/schemas';
import { workableValues } from '../common/values';

export const listJobs = createAction({
  auth: workableAuth,
  name: 'list_jobs',
  classification: 'SEARCH',
  displayName: 'List Jobs',
  description: 'Lists jobs, optionally by state or date, one page at a time.',
  audience: 'both',
  aiMetadata: {
    description:
      'List Workable jobs with shortcode, title, state, department and location. Filter by state (draft, published, archived, closed), created after or updated after a date. Returns one page of up to 100 jobs; when hasMore is true pass nextCursor as Cursor. Use to find a job shortcode. Read-only.',
    idempotent: true,
  },
  outputSchema: workableSchemas.jobs,
  props: {
    account_subdomain: accountSubdomainProp,
    state: Property.StaticDropdown({
      displayName: 'State',
      required: false,
      options: {
        options: [
          { label: 'Draft', value: 'draft' },
          { label: 'Published', value: 'published' },
          { label: 'Archived', value: 'archived' },
          { label: 'Closed', value: 'closed' },
        ],
      },
    }),
    created_after: Property.DateTime({ displayName: 'Created After', required: false }),
    updated_after: Property.DateTime({ displayName: 'Updated After', required: false }),
    limit: Property.Number({ displayName: 'Limit', description: 'Jobs per page, 1 to 100. Default 50.', required: false }),
    cursor: Property.ShortText({ displayName: 'Cursor', description: 'nextCursor from a previous run, to get the next page.', required: false }),
  },
  async run(context) {
    const p = context.propsValue;
    const v = workableValues;
    const client = workableOps.client({ auth: context.auth, subdomain: p.account_subdomain });
    return workableOps.listPage({
      client,
      path: '/jobs',
      key: 'jobs',
      query: {
        state: v.optionalText(p.state),
        created_after: v.isoDate({ value: p.created_after, label: 'Created After' }),
        updated_after: v.isoDate({ value: p.updated_after, label: 'Updated After' }),
      },
      limit: p.limit,
      cursor: p.cursor,
    });
  },
});
