import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { asanaAuth } from '../../auth';
import { ASANA_FIELDS, AsanaRecord, asanaClient, asanaUtils } from '../../common/client';
import { asanaProjectOutputSchema } from '../../output-schemas';

export const asanaAddProjectMembersAction = createAction({
  auth: asanaAuth,
  name: 'add_project_members',
  classification: 'WRITE',
  displayName: 'Add Project Members',
  description: 'Give users access to an Asana project.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Adds users as members of a project with the project\'s default access level and returns the updated project; their notification settings may also make them followers. Use Create Membership to add a team or to choose the access level. Existing members are unaffected, so repeating the call converges and is safe to retry.',
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
      description: 'Users to add, one per item: "me", an email address or a user gid.',
      required: true,
    }),
  },
  async run(context) {
    const { project, members } = context.propsValue;
    const memberList = asanaUtils.toStringArray(members);
    if (memberList.length === 0) {
      throw new Error('Members must contain at least one user ("me", an email address or a user gid).');
    }
    return asanaClient.asanaData<AsanaRecord>({
      auth: context.auth,
      method: HttpMethod.POST,
      path: `/projects/${asanaUtils.pathSegment(project)}/addMembers`,
      operation: 'Add Project Members',
      query: { opt_fields: ASANA_FIELDS.project },
      data: { members: memberList.join(',') },
    });
  },
});
