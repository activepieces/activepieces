import { createAction, Property } from '@activepieces/pieces-framework';
import axios from 'axios';
import { activityTextContent, props } from './shared';

export const updateActivity = createAction({
  name: 'update_activity',
  displayName: 'Update Activity',
  description: '',
  props: {
    id: Property.ShortText({
      displayName: activityTextContent.id.displayName,
      description: activityTextContent.id.description,
      required: true,
    }),
  ...props
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
