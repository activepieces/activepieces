import { createAction, Property } from '@activepieces/pieces-framework';
import { workableAuth } from '../auth';
import { workableOps } from '../common/operations';
import { accountSubdomainProp } from '../common/props';
import { workableSchemas } from '../common/schemas';
import { workableValues } from '../common/values';

export const listCandidates = createAction({
  auth: workableAuth,
  name: 'list_candidates',
  classification: 'SEARCH',
  displayName: 'List Candidates',
  description: 'Finds candidates by email, job, stage or date, one page at a time.',
  audience: 'both',
  aiMetadata: {
    description:
      'Search Workable candidates. Filter by exact email, job shortcode, stage slug (needs a job shortcode), created after or updated after a date. Returns one page of up to 100 candidates; when hasMore is true pass nextCursor as Cursor for the next page. Use to find a candidate ID. Read-only.',
    idempotent: true,
  },
  outputSchema: workableSchemas.candidates,
  props: {
    account_subdomain: accountSubdomainProp,
    email: Property.ShortText({ displayName: 'Email', description: 'Only candidates with this email.', required: false }),
    shortcode: Property.ShortText({ displayName: 'Job Shortcode', description: 'Only candidates of this job.', required: false }),
    stage: Property.ShortText({ displayName: 'Stage Slug', description: 'Only candidates in this stage. Needs Job Shortcode.', required: false }),
    created_after: Property.DateTime({ displayName: 'Created After', required: false }),
    updated_after: Property.DateTime({ displayName: 'Updated After', required: false }),
    limit: Property.Number({ displayName: 'Limit', description: 'Candidates per page, 1 to 100. Default 50.', required: false }),
    cursor: Property.ShortText({ displayName: 'Cursor', description: 'nextCursor from a previous run, to get the next page.', required: false }),
  },
  async run(context) {
    const p = context.propsValue;
    const v = workableValues;
    const shortcode = v.optionalText(p.shortcode);
    const stage = v.optionalText(p.stage);
    if (stage !== undefined && shortcode === undefined) {
      throw new Error('Stage Slug needs a Job Shortcode, because stages belong to a job.');
    }
    const query = {
      email: v.optionalText(p.email),
      shortcode,
      stage,
      created_after: v.isoDate({ value: p.created_after, label: 'Created After' }),
      updated_after: v.isoDate({ value: p.updated_after, label: 'Updated After' }),
    };
    const client = workableOps.client({ auth: context.auth, subdomain: p.account_subdomain });
    return workableOps.listPage({ client, path: '/candidates', key: 'candidates', query, limit: p.limit, cursor: p.cursor });
  },
});
