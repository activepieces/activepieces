import { createAction } from '@activepieces/pieces-framework';
import axios from 'axios';
import {  props } from './shared';

export const createActivity = createAction({
  name: 'create_activity',
  displayName: 'Create Activity',
  description: '',
  props: props,
  async run(context) {
    const response = await axios({
      method: 'POST',
      url: `${context.server.apiUrl}v1/worker/activities`,
      headers: {
        Authorization: `Bearer ${context.server.token}`,
      },
      data: {
        projectId: context.project.id,
        event: context.propsValue.event,
        message: context.propsValue.message,
        status: context.propsValue.status,
      },
    });

    return response.data;
  },
});
