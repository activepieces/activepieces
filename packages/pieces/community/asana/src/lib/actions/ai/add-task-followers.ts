import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { asanaAuth } from '../../auth';
import { ASANA_FIELDS, AsanaRecord, asanaClient, asanaUtils } from '../../common/client';
import { asanaTaskOutputSchema } from '../../output-schemas';

export const asanaAddTaskFollowersAction = createAction({
  auth: asanaAuth,
  name: 'add_task_followers',
  classification: 'WRITE',
  displayName: 'Add Task Followers',
  description: 'Add followers (collaborators) to an Asana task.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Adds users as followers of a task so they get its notifications, and returns the updated task. Users already following are unaffected, so repeating the call converges and is safe to retry.',
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
      description: 'Users to add, one per item: "me", an email address or a user gid.',
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
      path: `/tasks/${asanaUtils.pathSegment(task)}/addFollowers`,
      operation: 'Add Task Followers',
      query: { opt_fields: ASANA_FIELDS.task },
      data: { followers: followerList },
    });
  },
});
