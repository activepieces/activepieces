import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { logsnagAuth } from '../..';

export const createEvent = createAction({
  auth: logsnagAuth,
  name: 'createEvent',
  displayName: 'Create Event',
  description: 'Creates a new event in LogSnag with the specified channel and details.',
  props: {
    project: Property.ShortText({displayName: "Project", required: true}),
    channel: Property.ShortText({displayName: "Channel", required: true}),
    event:  Property.ShortText({displayName: "Event", required: true}),
    description: Property.ShortText({displayName: "Description", required: false}),
  },
  async run(context) {
    const { project, channel, event, description } = context.propsValue;
    const res = await httpClient.sendRequest<string[]>({
      method: HttpMethod.POST,
      url: 'https://api.logsnag.com/v1/log',
      headers: {
        Authorization: `Bearer ${context.auth.secret_text}`,
        "Content-Type": "application/json",
      },
      body: {
        project,
        channel,
        event,
        description,
      }
    });
    return res.body;
  },
});
