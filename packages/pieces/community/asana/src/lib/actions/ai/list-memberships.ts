import { createAction, Property } from '@activepieces/pieces-framework';
import { asanaAuth } from '../../auth';
import { AsanaRecord, asanaClient, asanaProps, asanaUtils } from '../../common/client';
import { asanaMembershipListOutputSchema } from '../../output-schemas';

export const asanaListMembershipsAction = createAction({
  auth: asanaAuth,
  name: 'list_memberships',
  classification: 'SEARCH',
  displayName: 'List Memberships',
  description: 'List who has access to a project, goal or portfolio, or which projects a team is in.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists memberships with their access levels. Pass a Parent (project, goal or portfolio gid) to see its members, optionally filtered to one Member; or pass only a team as Member to list the projects shared with that team. Use it to find the membership gid for Delete Membership. Paginated with next_offset; read-only and safe to retry.',
    idempotent: true,
  },
  outputSchema: asanaMembershipListOutputSchema,
  props: {
    parent: Property.ShortText({
      displayName: 'Parent GID',
      description: 'Gid of the project, goal or portfolio whose members to list. Leave empty only when Member is a team.',
      required: false,
    }),
    member: Property.ShortText({
      displayName: 'Member GID',
      description: 'Gid of a user or team to filter on. Required (and must be a team) when Parent is empty.',
      required: false,
    }),
    limit: asanaProps.limit({ noun: 'memberships' }),
    offset: asanaProps.offset(),
  },
  async run(context) {
    const { parent, member, limit, offset } = context.propsValue;
    const hasParent = asanaUtils.hasValue(parent);
    if (!hasParent && !asanaUtils.hasValue(member)) {
      throw new Error('Set Parent (a project, goal or portfolio gid), or set Member to a team gid to list that team\'s projects.');
    }
    return asanaClient.asanaListPage<AsanaRecord>({
      auth: context.auth,
      path: '/memberships',
      operation: 'List Memberships',
      query: {
        parent: hasParent ? String(parent).trim() : undefined,
        member: asanaUtils.hasValue(member) ? String(member).trim() : undefined,
        resource_subtype: hasParent ? undefined : 'project_membership',
      },
      limit,
      offset,
    });
  },
});
