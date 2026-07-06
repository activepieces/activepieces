import { createAction, Property } from '@activepieces/pieces-framework';
import { zooAuth } from '../../auth'
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const sendModelingCommandAction = createAction({
  name: 'send_modeling_command',
  displayName: 'Send Modeling Command',
  description: 'Send a command to the modeling WebSocket endpoint',
  audience: 'both',
  aiMetadata: { description: 'Resolve the Zoo modeling WebSocket endpoint and pair it with a modeling command for a client to dispatch over that connection. Use when you need the live WebSocket URL to drive geometry/CAD modeling commands; this only fetches the endpoint URL and echoes the command back, so it does not itself execute the command and is safe to call repeatedly.', idempotent: true },
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
        Authorization: `Bearer ${auth.secret_text}`,
      },
    });

    // Return the WebSocket URL and command for the client to handle the connection
    return {
      websocketUrl: response.body.url,
      command: propsValue.command,
    };
  },
});
