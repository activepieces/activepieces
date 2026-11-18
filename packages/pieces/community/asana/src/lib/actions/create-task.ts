import { asanaCommon, callAsanaApi } from '../common';
import { asanaClient, asanaUtils } from '../common/client';
import { getAccessTokenOrThrow, HttpMethod } from '@activepieces/pieces-common';
import dayjs from 'dayjs';
import { asanaAuth } from '../auth';
import { Property, createAction } from '@activepieces/pieces-framework';
import { asanaCreateTaskOutputSchema } from '../output-schemas';

export const asanaCreateTaskAction = createAction({
  auth: asanaAuth,
  name: 'create_task',
  classification: 'WRITE',
  description: 'Create a new task',
  audience: 'human',
  aiMetadata: { description: 'Create a new task in an Asana project, setting its name, description (notes), optional due date, assignee, and tags. Use when an agent needs to add a work item to Asana. Requires a workspace and project; not idempotent — each call creates a separate task even with identical input.', idempotent: false },
  displayName: 'Create Task',
  outputSchema: asanaCreateTaskOutputSchema,
  propertyGroups: [
    {
      key: 'location',
      display: 'section',
      label: 'Where',
      icon: 'location',
      props: ['workspace', 'project'],
    },
    {
      key: 'task',
      display: 'section',
      label: 'Task',
      icon: 'text',
      props: ['name', 'notes'],
    },
    {
      key: 'details',
      display: 'section',
      label: 'Details',
      icon: 'sliders',
      props: ['assignee', 'due_on', 'tags'],
    },
  ],
  props: {
    workspace: asanaCommon.workspace,
    project: asanaCommon.project,
    name: Property.ShortText({
      displayName: 'Name',
      placeholder: 'e.g. Review the Q4 budget',
      required: true,
    }),
    notes: Property.LongText({
      description: "Plain text shown in the task's description.",
      displayName: 'Description',
      required: false,
    }),
    due_on: Property.ShortText({
      description:
        'Day the task is due. For a due time too, use 2026-12-31T14:00:00Z.',
      displayName: 'Due Date',
      placeholder: 'e.g. 2026-12-31',
      required: false,
    }),
    tags: asanaCommon.tags,
    assignee: asanaCommon.assignee,
  },
  async run(configValue) {
    const { auth } = configValue;
    const { project, name, notes, tags, workspace, due_on, assignee } =
      configValue.propsValue;

    const dueFields = buildDueFields(due_on);

    const requestedTags = asanaUtils.toStringArray(tags);
    const tagsGids =
      requestedTags.length > 0
        ? await asanaClient.resolveTagGids({
            auth: { access_token: auth.access_token },
            workspace,
            tags: requestedTags,
          })
        : [];

    return (
      await callAsanaApi<{ data: Record<string, unknown> }>(
        HttpMethod.POST,
        `tasks`,
        getAccessTokenOrThrow(auth),
        {
          data: {
            name,
            projects: [project],
            notes,
            assignee,
            ...dueFields,
            tags: tagsGids,
          },
        }
      )
    ).body['data'];
  },
});

function buildDueFields(value: string | undefined): DueFields {
  const trimmed = (value ?? '').trim();
  if (trimmed === '') {
    return {};
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return {
      due_on: asanaUtils.assertDate({ value: trimmed, field: 'Due Date' }),
    };
  }
  if (dayjs(trimmed).isValid()) {
    return { due_at: dayjs(trimmed).toISOString() };
  }
  throw new Error(
    `Due Date "${trimmed}" is not a date. Use a date like 2026-12-31.`
  );
}

type DueFields = {
  due_on?: string;
  due_at?: string;
};
