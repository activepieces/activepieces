import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { asanaAuth } from '../../auth';
import { ASANA_FIELDS, AsanaRecord, asanaClient, asanaUtils } from '../../common/client';
import { asanaProjectOutputSchema } from '../../output-schemas';

export const asanaRemoveProjectFollowersAction = createAction({
  auth: asanaAuth,
  name: 'remove_project_followers',
  classification: 'WRITE',
  displayName: 'Remove Project Followers',
  description: 'Unsubscribe users from "task added" notifications of an Asana project.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Removes users from the followers of a project so they stop getting "task added" notifications, and returns the updated project. Their membership is not affected (use Remove Project Members for that). Users not following are ignored, so repeating the call converges and is safe to retry.',
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
      description: 'Users to remove, one per item: "me", an email address or a user gid.',
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
      path: `/projects/${asanaUtils.pathSegment(project)}/removeFollowers`,
      operation: 'Remove Project Followers',
      query: { opt_fields: ASANA_FIELDS.project },
      data: { followers: followerList.join(',') },
    });
  },
});
