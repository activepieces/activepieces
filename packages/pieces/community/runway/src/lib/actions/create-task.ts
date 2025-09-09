import { Property, createAction } from '@activepieces/pieces-framework';
import { runwayAuth } from '../../index';
import { runwayRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const runwayCreateTask = createAction({
  auth: runwayAuth,
  name: 'runway_create_task',
  displayName: 'Create Task',
  description: 'Create a Runway task (pass task payload as JSON).',
  props: {
    payload: Property.Json({
      displayName: 'Task Payload (JSON)',
      description:
        'Raw JSON body for POST /v1/tasks. Refer to Runway API to set fields like prompt, assets, parameters, etc.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const token = auth as string;
    const body = propsValue.payload as Record<string, unknown>;
    const res = await runwayRequest<any>(token, HttpMethod.POST, '/tasks', body);
    return res.body;
  },
});

