import {
  DynamicPropsValue,
  MarkdownVariant,
  PieceAuth,
  Property,
  createAction,
  sanitizeHttpHeaders,
} from '@activepieces/pieces-framework';
import { StopResponse } from '@activepieces/pieces-framework';

const HTTP_STATUS_OK = 200;
const HTTP_STATUS_MOVED_PERMANENTLY = 301;

enum ResponseType {
  JSON = 'json',
  RAW = 'raw',
  REDIRECT = 'redirect',
}

enum FlowExecution {
  STOP = 'stop',
  RESPOND = 'respond',
}

export const returnResponse = createAction({
  audience: 'both',
  name: 'return_response',
  classification: 'WRITE',
  displayName: 'Return Response',
  description: 'Sends an HTTP response back to the webhook caller.',
  aiMetadata: { description: 'Sends the HTTP response for a run started by the Catch Webhook trigger, with the body typed as JSON, Raw, or Redirect and Flow Execution choosing whether the run stops here or responds and continues; leave Flow Execution unset and no response is emitted. Prefer Respond and Wait for Next Webhook when the flow must answer then pause for a follow-up call, or the Forms piece Respond on UI action for form and chat triggers. Only synchronous (/sync) webhook calls receive it; not idempotent, since each call emits a response.', idempotent: false },
  props: {
    syncNote: Property.MarkDown({
      value: 'Only callers of a `/sync` URL wait for this response.',
      variant: MarkdownVariant.INFO,
    }),
    responseType: Property.StaticDropdown({
      displayName: 'Response Type',
      description: 'Format of the response body.',
      required: false,
      defaultValue: 'json',
      options: {
        disabled: false,
        options: [
          {
            label: 'JSON',
            value: ResponseType.JSON,
          },
          {
            label: 'Raw',
            value: ResponseType.RAW,
          },
          {
            label: 'Redirect',
            value: ResponseType.REDIRECT,
          },
        ],
      },
    }),
    fields: Property.DynamicProperties({
      auth: PieceAuth.None(),
      displayName: 'Response',
      refreshers: ['responseType'],
      required: true,
      props: async ({ responseType }) => {
        if (!responseType) return {};

        const bodyTypeInput = responseType as unknown as ResponseType;

        const fields: DynamicPropsValue = {};

        if (bodyTypeInput !== ResponseType.REDIRECT) {
          fields['status'] = Property.Number({
            displayName: 'Status',
            description: 'HTTP status code sent to the caller.',
            required: false,
            defaultValue: 200,
          });
          fields['headers'] = Property.Object({
            displayName: 'Headers',
            description: 'Extra HTTP headers to send with the response.',
            required: false,
          });
        }

        switch (bodyTypeInput) {
          case ResponseType.JSON:
            fields['body'] = Property.Json({
              displayName: 'JSON Body',
              description: 'Must be valid JSON.',
              required: true,
            });
            break;
          case ResponseType.RAW:
            fields['body'] = Property.LongText({
              displayName: 'Raw Body',
              description: 'Sent as is; add a Content-Type header for HTML.',
              required: true,
            });
            break;
          case ResponseType.REDIRECT:
            fields['body'] = Property.LongText({
              displayName: 'Redirect URL',
              description: 'Callers are sent here with a 301 redirect.',
              placeholder: 'https://example.com/thank-you',
              required: true,
            });
            break;
        }
        return fields;
      },
    }),
    respond: Property.StaticDropdown({
      displayName: 'Flow Execution',
      description: 'Stop ends the run here; Respond and Continue runs later steps.',
      required: false,
      defaultValue: FlowExecution.STOP,
      options: {
        disabled: false,
        options: [
          { label: 'Stop', value: FlowExecution.STOP },
          { label: 'Respond and Continue', value: FlowExecution.RESPOND },
        ],
      },
    }),
  },
  propertyGroups: [
    { key: 'response', display: 'section', label: 'Response', icon: 'reply', props: ['syncNote', 'responseType', 'fields'] },
    { key: 'afterResponding', display: 'section', label: 'After Responding', icon: 'sliders', props: ['respond'] },
  ],

  async run(context) {
    const { fields, responseType, respond } = context.propsValue;
    const bodyInput = fields ['body'];
    const headers = sanitizeHttpHeaders(fields['headers']);
    const status = fields['status'];
    
 
    const response: StopResponse = {
      status: status ?? HTTP_STATUS_OK,
      headers,
    };

    switch (responseType) {
      case ResponseType.JSON:
        response.body = praseToJson(bodyInput);
        break;
      case ResponseType.RAW:
        response.body = bodyInput;
        break;
      case ResponseType.REDIRECT:
        response.status = HTTP_STATUS_MOVED_PERMANENTLY;
        response.headers = { ...response.headers, Location: ensureProtocol(bodyInput) };
        response.body = bodyInput;
        break;
    }
    
    switch(respond){
      case FlowExecution.STOP:
        {
          context.run.stop({
            response,
          });
          break;
        }
      case FlowExecution.RESPOND:
        {
          context.run.respond({
            response,
          });
          break;
        }
        case undefined:
          break;
    }
 

    return response;
  },
});

function praseToJson(body: unknown) {
  if (typeof body === 'string') {
    return JSON.parse(body);
  }
  return JSON.parse(JSON.stringify(body));
}

function ensureProtocol(url: string): string {
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return `https://${url}`;
  }
  return url;
}
