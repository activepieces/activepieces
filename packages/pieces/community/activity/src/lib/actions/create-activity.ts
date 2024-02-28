import { createAction, Property } from '@activepieces/pieces-framework';
import axios from 'axios';

export const createActivity = createAction({
  name: 'create_activity',
  displayName: 'create activity',
  description: '',
  props: {
    event: Property.ShortText({
      displayName: 'Event',
      description: '',
      required: true,
    }),
    message: Property.LongText({
      displayName: 'Message',
      description: '',
      required: true,
    }),
    status: Property.ShortText({
      displayName: 'Status',
      description: '',
      required: true,
    }),
  },
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
