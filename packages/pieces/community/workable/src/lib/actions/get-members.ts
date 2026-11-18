import { createAction, Property } from '@activepieces/pieces-framework';
import { workableAuth } from '../auth';
import { workableOps } from '../common/operations';
import { accountSubdomainProp } from '../common/props';
import { workableSchemas } from '../common/schemas';
import { workableValues } from '../common/values';

export const getMembers = createAction({
  auth: workableAuth,
  name: 'getMembers',
  classification: 'SEARCH',
  displayName: 'Get Members',
  description: 'Lists members of the hiring team, one page at a time.',
  audience: 'both',
  aiMetadata: {
    description:
      'List Workable account members (hiring team users) with ID, name, email and role. Filter by role, job shortcode, email or exact name. Returns one page; when hasMore is true pass nextCursor as Cursor. Use to find the acting member ID that moving, rating, commenting and disqualifying need. Read-only.',
    idempotent: true,
  },
  outputSchema: workableSchemas.members,
  props: {
    account_subdomain: accountSubdomainProp,
    role: Property.StaticDropdown({
      displayName: 'Role',
      required: false,
      options: {
        options: [
          { label: 'Admin', value: 'admin' },
          { label: 'Simple', value: 'simple' },
          { label: 'Reviewer', value: 'reviewer' },
        ],
      },
    }),
    shortcode: Property.ShortText({ displayName: 'Job Shortcode', description: 'Only members of this job.', required: false }),
    email: Property.ShortText({ displayName: 'Email', description: 'Only the member with this email.', required: false }),
    name: Property.ShortText({ displayName: 'Name', description: 'Only members with this exact name.', required: false }),
    limit: Property.Number({ displayName: 'Limit', description: 'Members per page, 1 to 100. Default 50.', required: false }),
    cursor: Property.ShortText({ displayName: 'Cursor', description: 'nextCursor from a previous run, to get the next page.', required: false }),
  },
  async run(context) {
    const p = context.propsValue;
    const client = workableOps.client({ auth: context.auth, subdomain: p.account_subdomain });
    return workableOps.listPage({
      client,
      path: '/members',
      key: 'members',
      query: {
        role: workableValues.optionalText(p.role),
        shortcode: workableValues.optionalText(p.shortcode),
        email: workableValues.optionalText(p.email),
        name: workableValues.optionalText(p.name),
      },
      limit: p.limit,
      cursor: p.cursor,
    });
  },
});
