import {
  DynamicPropsValue,
  Property,
  createAction,
} from '@activepieces/pieces-framework';
import { StopResponse } from '@activepieces/shared';
import { StatusCodes } from 'http-status-codes';


export const replyToMcpClient = createAction({
  name: 'reply_to_mcp_client',
  displayName: 'Reply to MCP Client',
  description: 'Return a response to the MCP client that called the tool.',
  props: {
    note: Property.MarkDown({
      value: '**Important**: Make sure your MCP trigger has (Wait for Response) turned on.'
    }),
    mode: Property.StaticDropdown({
      displayName: 'Mode',
      description: 'Choose Simple for key-value or Advanced for JSON.',
      required: true,
      defaultValue: 'simple',
      options: {
        disabled: false,
        options: [
          {
            label: 'Simple',
            value: 'simple',
          },
          {

            label: 'Advanced',
            value: 'advanced',
          },
        ],
      },
    }),
    response: Property.DynamicProperties({
      displayName: 'Response',
      required: true,
      refreshers: ['mode'],
      props: async (propsValue) => {
        const mode = propsValue['mode'] as unknown as string;
        const fields: DynamicPropsValue = {};
        if (mode === 'simple') {
          fields['response'] = Property.Object({
            displayName: 'Response',
            required: true,
          });
        } else {
          fields['response'] = Property.Json({
            displayName: 'Response',
            required: true,
          });
        }
        return fields;
      },
    }),
    respond: Property.StaticDropdown({
      displayName: 'Flow Execution',
      required: false,
      defaultValue: 'stop',
      options: {
        disabled: false,
        options: [
          { label: 'Stop', value: 'stop' },
          { label: 'Respond and Continue', value: 'respond' },
        ],
      },
    }),
  },

  async run(context) {
    const { response, respond } = context.propsValue;

    const stopResponse: StopResponse = {
      status: StatusCodes.OK,
      headers: {},
      body: response
    };
    
    if (respond === 'respond') {
      context.run.respond({
        response: stopResponse,
      });
    } else {
      context.run.stop({
        response: stopResponse,
      });
    }
    return stopResponse;
  },
});
