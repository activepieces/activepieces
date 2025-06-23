import { asanaCommon, callAsanaApi, getTags } from '../common';
import { getAccessTokenOrThrow, HttpMethod } from '@activepieces/pieces-common';
import dayjs from 'dayjs';
import { asanaAuth } from '../../';
import { Property, createAction } from '@activepieces/pieces-framework';

export const asanaCreateTaskAction = createAction({
  auth: asanaAuth,
  name: 'create_task',
  description: 'Create a new task',
  displayName: 'Create Task',
  props: {
    workspace: asanaCommon.workspace,
    project: asanaCommon.project,
    name: Property.ShortText({
      description: 'The name of the task to create',
      displayName: 'Task Name',
      required: true,
    }),
    notes: Property.LongText({
      description:
        'Free-form textual information associated with the task (i.e. its description).',
      displayName: 'Task Description',
      required: true,
    }),
    //Should be due_at in future minor version bump
    due_on: Property.ShortText({
      description: 'The date on which this task is due in any format.',
      displayName: 'Due Date',
      required: false,
    }),
    tags: asanaCommon.tags,
    assignee: asanaCommon.assignee,
  },
  async run(configValue) {
    const { auth } = configValue;
    const { project, name, notes, tags, workspace, due_on, assignee } =
      configValue.propsValue;

    const convertedDueAt = due_on ? dayjs(due_on).toISOString() : undefined;

    // User can provide tags name as dynamic value, we need to convert them to tags gids
    const userTags = tags ?? [];
    const convertedTags = await getTags(auth.access_token, workspace);
    const tagsGids = userTags
      .map((tag: string) => {
        const foundTagById = convertedTags.find(
          (convertedTag) => convertedTag.gid === tag
        );
        if (foundTagById) {
          return foundTagById.gid;
        }
        const foundTag = convertedTags.find(
          (convertedTag) =>
            convertedTag.name?.toLowerCase() === tag.toLowerCase()
        );
        if (foundTag) {
          return foundTag.gid;
        }
        return null;
      })
      .filter((tag) => tag !== null);

    return (
      await callAsanaApi(
        HttpMethod.POST,
        `tasks`,
        getAccessTokenOrThrow(auth),
        {
          data: {
            name,
            projects: [project],
            notes,
            assignee,
            due_at: convertedDueAt,
            tags: tagsGids,
          },
        }
      )
    ).body['data'];
  },
});
