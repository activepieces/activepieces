import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';

import { streakAuth } from '../auth';
import { boxKeyProp, pipelineKeyProp } from '../common/props';
import { cleanPayload, streakRequest } from '../common/client';

export const createTaskAction = createAction({
  name: 'create_task',
  displayName: 'Create Task',
  description: 'Create a task on a Streak box.',
  auth: streakAuth,
  props: {
    pipelineKey: pipelineKeyProp,
    boxKey: boxKeyProp,
    text: Property.ShortText({
      displayName: 'Task Text',
      required: true,
    }),
    dueDate: Property.DateTime({
      displayName: 'Due Date',
      description: 'Due date for the task.',
      required: false,
    }),
    assignedToSharingEntryKey: Property.ShortText({
      displayName: 'Assigned To Sharing Entry Key',
      description: 'Optional sharing entry key for the assignee.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const response = await streakRequest({
      apiKey: auth.props.api_key,
      method: HttpMethod.POST,
      path: `/v2/boxes/${encodeURIComponent(propsValue.boxKey)}/tasks`,
      body: cleanPayload({
        text: propsValue.text,
        dueDate: propsValue.dueDate
          ? new Date(propsValue.dueDate).getTime()
          : undefined,
        assignedToSharingEntryKey: propsValue.assignedToSharingEntryKey,
      }),
    });

    return response.body;
  },
});
