import { Property, createAction } from '@activepieces/pieces-framework';
import { moxieCRMAuth } from '../../auth';
import { credentialsOf } from '../../common';
import { moxieFields } from '../../common/fields';
import { moxieOperations } from '../../common/operations';
import { moxieProps } from '../../common/props';
import { moxieActionOutputSchemas } from '../../output-schemas';

export const moxieTaskCreateAction = createAction({
  auth: moxieCRMAuth,
  name: 'moxie_task_create',
  classification: 'WRITE',
  displayName: 'Create Task',
  description: 'Creates a task inside an existing Moxie project.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Creates a task (deliverable) in a project identified by exact client and project names, with optional stage label, dates, priority, subtasks, assignee emails and custom values. Use to add work items to a known project; resolve names with Search Projects and stage labels with List Task Stages. Not idempotent: each call creates a separate task.',
    idempotent: false,
  },
  outputSchema: moxieActionOutputSchemas.task,
  props: {
    name: Property.ShortText({
      displayName: 'Task Name',
      description: 'Name of the new task.',
      required: true,
    }),
    clientName: Property.ShortText({
      displayName: 'Client Name',
      description: 'Exact name of the client that owns the project, from Search Clients.',
      required: true,
    }),
    projectName: Property.ShortText({
      displayName: 'Project Name',
      description: 'Exact name of the project, from Search Projects.',
      required: true,
    }),
    status: Property.ShortText({
      displayName: 'Stage',
      description: 'Stage label to place the task in, from List Task Stages. Leave empty for the default stage.',
      required: false,
    }),
    ...moxieProps.fromSpecs({ specs: moxieFields.taskCreate, audience: 'ai' }),
  },
  async run({ auth, propsValue }) {
    return moxieOperations.createTask({ credentials: credentialsOf({ auth }), values: propsValue });
  },
});
