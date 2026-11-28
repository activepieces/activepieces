import {
  DynamicPropsValue,
  MarkdownVariant,
  PieceAuth,
  Property,
  createAction,
} from '@activepieces/pieces-framework';
import { StopResponse } from '@activepieces/pieces-framework';
import { StatusCodes } from 'http-status-codes';


export const replyToMcpClient = createAction({
  audience: 'both',
  name: 'reply_to_mcp_client',
  classification: 'WRITE',
  displayName: 'Reply to MCP Client',
  description: 'Return a response to the MCP client that called the tool.',
  aiMetadata: { description: 'Send a result payload back to the MCP client that invoked this flow through the MCP Tool trigger, supplied either as key-value pairs (Simple mode) or as raw JSON (Advanced mode), and either stop the run there or respond and let the remaining steps continue. Only meaningful in a flow started by the MCP Tool trigger with Wait for Response enabled; without that the client receives nothing. Not idempotent: each call emits a response to the waiting client and changes the run execution state.', idempotent: false },
  propertyGroups: [
    {
      key: 'reply',
      display: 'section',
      label: 'Reply',
      icon: 'reply',
      props: ['note', 'mode', 'response'],
    },
    {
      key: 'after',
      display: 'section',
      label: 'After Replying',
      icon: 'send',
      props: ['respond'],
    },
  ],
  props: {
    note: Property.MarkDown({
      variant: MarkdownVariant.WARNING,
      value: 'Turn on **Wait for Response** in the MCP Tool trigger, or the client receives nothing.'
    }),
    mode: Property.StaticDropdown({
      displayName: 'Mode',
      description: 'How you want to write the reply.',
      required: true,
      defaultValue: 'simple',
      display: 'cards',
      options: {
        disabled: false,
        options: [
          {
            label: 'Simple',
            value: 'simple',
            description: 'Key-value pairs',
            icon: 'sliders',
          },
          {
            label: 'Advanced',
            value: 'advanced',
            description: 'Raw JSON',
            icon: 'code',
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
            displayName: 'Fields',
            required: true,
          });
        } else {
          fields['response'] = Property.Json({
            displayName: 'JSON',
            required: true,
          });
        }
        return fields;
      },
    }),
    respond: Property.StaticDropdown({
      displayName: 'Flow Execution',
      description: 'Stop ends the run. Respond and Continue runs the next steps too.',
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
