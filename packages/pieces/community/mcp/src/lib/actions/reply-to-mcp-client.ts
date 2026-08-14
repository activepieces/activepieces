import {
  DynamicPropsValue,
  PieceAuth,
  Property,
  createAction,
} from '@activepieces/pieces-framework';
import { StopResponse } from '@activepieces/pieces-framework';
import { StatusCodes } from 'http-status-codes';


export const replyToMcpClient = createAction({
  audience: 'both',
  name: 'reply_to_mcp_client',
  displayName: 'Reply to MCP Client',
  description: 'Return a response to the MCP client that called the tool.',
  aiMetadata: { description: 'Send a result payload back to the MCP client that invoked this flow through the MCP Tool trigger, supplied either as key-value pairs (Simple mode) or as raw JSON (Advanced mode), and either stop the run there or respond and let the remaining steps continue. Only meaningful in a flow started by the MCP Tool trigger with Wait for Response enabled; without that the client receives nothing. Not idempotent: each call emits a response to the waiting client and changes the run execution state.', idempotent: false },
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
      auth: PieceAuth.None(),
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
