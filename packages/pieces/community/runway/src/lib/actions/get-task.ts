import { Property, createAction } from '@activepieces/pieces-framework';
import { runwayAuth } from '../../index';
import { runwayRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const runwayGetTask = createAction({
  auth: runwayAuth,
  name: 'runway_get_task',
  displayName: 'Get Task Details',
  description: 'Fetch a task by ID.',
  props: {
    task_id: Property.ShortText({
      displayName: 'Task ID',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const token = auth as string;
    const id = propsValue.task_id as string;
    const res = await runwayRequest<any>(token, HttpMethod.GET, `/tasks/${encodeURIComponent(id)}`);
    return res.body;
  },
});

