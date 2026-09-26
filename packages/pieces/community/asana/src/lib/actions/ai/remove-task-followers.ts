import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { asanaAuth } from '../../auth';
import { ASANA_FIELDS, AsanaRecord, asanaClient, asanaUtils } from '../../common/client';
import { asanaTaskOutputSchema } from '../../output-schemas';

export const asanaRemoveTaskFollowersAction = createAction({
  auth: asanaAuth,
  name: 'remove_task_followers',
  classification: 'WRITE',
  displayName: 'Remove Task Followers',
  description: 'Remove followers from an Asana task.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Removes users from the followers of a task so they stop getting its notifications, and returns the updated task. Users not following are ignored, so repeating the call converges and is safe to retry.',
    idempotent: true,
  },
  outputSchema: asanaTaskOutputSchema,
  props: {
    task: Property.ShortText({
      displayName: 'Task GID',
      description: 'Gid of the task. Obtain it from List Project Tasks or Search Workspace Objects.',
      required: true,
    }),
    followers: Property.Array({
      displayName: 'Followers',
      description: 'Users to remove, one per item: "me", an email address or a user gid.',
      required: true,
    }),
  },
  async run(context) {
    const { task, followers } = context.propsValue;
    const followerList = asanaUtils.toStringArray(followers);
    if (followerList.length === 0) {
      throw new Error('Followers must contain at least one user ("me", an email address or a user gid).');
    }
    return asanaClient.asanaData<AsanaRecord>({
      auth: context.auth,
      method: HttpMethod.POST,
      path: `/tasks/${asanaUtils.pathSegment(task)}/removeFollowers`,
      operation: 'Remove Task Followers',
      query: { opt_fields: ASANA_FIELDS.task },
      data: { followers: followerList },
    });
  },
});
