import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { moxieCRMAuth } from '../auth';
import { credentialsOf } from '../common';
import { moxieRequest } from '../common/client';
import { moxieInput } from '../common/props';
import { moxieActionOutputSchemas } from '../output-schemas';

export const moxieApproveTaskAction = createAction({
  auth: moxieCRMAuth,
  name: 'moxie_approve_task',
  classification: 'WRITE',
  displayName: 'Approve Task',
  description: 'Approve a task that is waiting for client approval.',
  audience: 'both',
  aiMetadata: {
    description:
      'Approves a task (deliverable) waiting for client approval, identified by exact client, project and task names, as if the client signed it off in the portal. Use when the approval arrives outside Moxie, for example by email. Not marked idempotent: a repeat call on an approved task may be rejected.',
    idempotent: false,
  },
  outputSchema: moxieActionOutputSchemas.approvedTask,
  props: {
    clientName: Property.ShortText({
      displayName: 'Client Name',
      description: 'Exact client name, from Search Clients.',
      required: true,
    }),
    projectName: Property.ShortText({
      displayName: 'Project Name',
      description: 'Exact project name, from Search Projects.',
      required: true,
    }),
    taskName: Property.ShortText({
      displayName: 'Task Name',
      description: 'Exact task name, from Search Tasks or List Tasks.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    return moxieRequest<unknown>({
      credentials: credentialsOf({ auth }),
      method: HttpMethod.POST,
      path: '/action/deliverable/approve',
      body: {
        clientName: moxieInput.requiredText({ value: propsValue.clientName, field: 'Client Name' }),
        projectName: moxieInput.requiredText({ value: propsValue.projectName, field: 'Project Name' }),
        deliverableName: moxieInput.requiredText({ value: propsValue.taskName, field: 'Task Name' }),
      },
      notFoundMessage: 'Moxie could not find that client, project or task. All three names must match exactly.',
    });
  },
});
