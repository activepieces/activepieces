import { createAction, Property } from '@activepieces/pieces-framework';
import { zooAuth } from '../../../index'
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const sendModelingCommandAction = createAction({
  name: 'send_modeling_command',
  displayName: 'Send Modeling Command',
  description: 'Send a command to the modeling WebSocket endpoint',
  auth: zooAuth,
  // category: 'Modeling',
  props: {
    command: Property.Object({
      displayName: 'Command',
      required: true,
      description: 'The modeling command to send',
    }),
  },
  async run({ auth, propsValue }) {
    // First get the WebSocket URL
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.zoo.dev/ws/modeling/commands',
      headers: {
        Authorization: `Bearer ${auth}`,
      },
    });

    // Return the WebSocket URL and command for the client to handle the connection
    return {
      websocketUrl: response.body.url,
      command: propsValue.command,
    };
  },
});
