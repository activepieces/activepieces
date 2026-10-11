import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { asanaAuth } from '../../auth';
import { ASANA_FIELDS, AsanaAuth, AsanaRecord, asanaClient, asanaUtils } from '../../common/client';
import { asanaProjectOutputSchema } from '../../output-schemas';

export const asanaRemoveProjectMembersAction = createAction({
  auth: asanaAuth,
  name: 'remove_project_members',
  classification: 'DESTRUCTIVE',
  displayName: 'Remove Project Members',
  description: 'Revoke users\' membership of an Asana project.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Removes users from the members of a project, revoking the access that membership gave them (a private project becomes invisible to them), and returns the updated project. Use Remove Project Followers to only stop notifications. Users who are not members are ignored, so repeating the call converges.',
    idempotent: true,
  },
  outputSchema: asanaProjectOutputSchema,
  props: {
    project: Property.ShortText({
      displayName: 'Project GID',
      description: 'Gid of the project. Obtain it from List Projects or Search Workspace Objects.',
      required: true,
    }),
    members: Property.Array({
      displayName: 'Members',
      description: 'Users to remove, one per item: "me", an email address or a user gid.',
      required: true,
    }),
  },
  async run(context) {
    const { project, members } = context.propsValue;
    const memberList = asanaUtils.toStringArray(members);
    if (memberList.length === 0) {
      throw new Error('Members must contain at least one user ("me", an email address or a user gid).');
    }
    const memberGids = await Promise.all(
      memberList.map((member) => toUserGid({ auth: context.auth, member })),
    );
    return asanaClient.asanaData<AsanaRecord>({
      auth: context.auth,
      method: HttpMethod.POST,
      path: `/projects/${asanaUtils.pathSegment(project)}/removeMembers`,
      operation: 'Remove Project Members',
      query: { opt_fields: ASANA_FIELDS.project },
      data: { members: memberGids.join(',') },
    });
  },
});

async function toUserGid({ auth, member }: { auth: AsanaAuth; member: string }): Promise<string> {
  if (/^\d+$/.test(member)) {
    return member;
  }
  const user = await asanaClient.asanaData<AsanaRecord>({
    auth,
    method: HttpMethod.GET,
    path: `/users/${asanaUtils.pathSegment(member)}`,
    operation: 'Remove Project Members',
    query: { opt_fields: 'gid' },
  });
  return String(user['gid']);
}
