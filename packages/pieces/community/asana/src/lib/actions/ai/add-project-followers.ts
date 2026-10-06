import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { asanaAuth } from '../../auth';
import { ASANA_FIELDS, AsanaRecord, asanaClient, asanaUtils } from '../../common/client';
import { asanaProjectOutputSchema } from '../../output-schemas';

export const asanaAddProjectFollowersAction = createAction({
  auth: asanaAuth,
  name: 'add_project_followers',
  classification: 'WRITE',
  displayName: 'Add Project Followers',
  description: 'Subscribe users to "task added" notifications of an Asana project.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Adds users as followers of a project so they are notified when tasks are added, and returns the updated project. Users who are not yet members also become members. Existing followers are unaffected, so repeating the call converges and is safe to retry.',
    idempotent: true,
  },
  outputSchema: asanaProjectOutputSchema,
  props: {
    project: Property.ShortText({
      displayName: 'Project GID',
      description: 'Gid of the project. Obtain it from List Projects or Search Workspace Objects.',
      required: true,
    }),
    followers: Property.Array({
      displayName: 'Followers',
      description: 'Users to add, one per item: "me", an email address or a user gid.',
      required: true,
    }),
  },
  async run(context) {
    const { project, followers } = context.propsValue;
    const followerList = asanaUtils.toStringArray(followers);
    if (followerList.length === 0) {
      throw new Error('Followers must contain at least one user ("me", an email address or a user gid).');
    }
    return asanaClient.asanaData<AsanaRecord>({
      auth: context.auth,
      method: HttpMethod.POST,
      path: `/projects/${asanaUtils.pathSegment(project)}/addFollowers`,
      operation: 'Add Project Followers',
      query: { opt_fields: ASANA_FIELDS.project },
      data: { followers: followerList.join(',') },
    });
  },
});
