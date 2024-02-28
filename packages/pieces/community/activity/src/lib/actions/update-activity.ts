import { createAction, Property } from '@activepieces/pieces-framework';
import axios from 'axios';

export const updateActivity = createAction({
  name: 'update_activity',
  displayName: 'update activity',
  description: '',
  props: {
    id: Property.ShortText({
      displayName: 'ID',
      description: '',
      required: true,
    }),
    status: Property.ShortText({
      displayName: 'Status',
      description: '',
      required: true,
    }),
    event: Property.ShortText({
      displayName: 'Event',
      description: '',
      required: false,
    }),
    message: Property.LongText({
      displayName: 'Message',
      description: '',
      required: false,
    }),
  },
  async run(context) {
    const response = await axios({
      method: 'POST',
      url: `${context.server.apiUrl}v1/worker/activities/${context.propsValue.id}`,
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
