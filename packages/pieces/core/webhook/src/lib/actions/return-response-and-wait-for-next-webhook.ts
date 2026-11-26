import {
    DynamicPropsValue,
    MarkdownVariant,
    PieceAuth,
    Property,
    createAction,
    sanitizeHttpHeaders,
  } from '@activepieces/pieces-framework';
  import { ExecutionType, StopResponse } from '@activepieces/pieces-framework';

  const HTTP_STATUS_OK = 200;
  const HTTP_STATUS_MOVED_PERMANENTLY = 301;

  enum ResponseType {
    JSON = 'json',
    RAW = 'raw',
    REDIRECT = 'redirect',
  }
  

  const RESUME_WEBHOOK_HEADER = 'x-activepieces-resume-webhook-url';
  export const returnResponseAndWaitForNextWebhook = createAction({
    audience: 'both',
    name: 'return_response_and_wait_for_next_webhook',
    classification: 'WRITE',
    displayName: 'Respond and Wait for Next Webhook',
    description: 'Sends a response, then pauses until the next webhook call resumes the flow.',
    aiMetadata: { description: 'Replies to a webhook caller with a JSON, Raw, or Redirect body and attaches an x-activepieces-resume-webhook-url header holding a freshly minted callback URL, then suspends the run until that URL is called. Pick it for a multi-request handshake inside one flow; prefer plain Return Response when no follow-up call is needed, or Wait for Approval or the Delay piece when a human or a timer resumes the flow. Not idempotent: each execution creates a new waitpoint with a different resume URL and suspends the run again.', idempotent: false },
    props: {
        markdown: Property.MarkDown({
            value: `JSON and Raw responses to the \`/sync\` URL carry an \`${RESUME_WEBHOOK_HEADER}\` header. Call that URL to resume the flow.`,
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
    },
    propertyGroups: [
      { key: 'response', display: 'section', label: 'Response', icon: 'reply', props: ['markdown', 'responseType', 'fields'] },
    ],

    async run(context) {
      const { fields, responseType } = context.propsValue;
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

      if(context.executionType === ExecutionType.BEGIN){
        const waitpoint = await context.run.createWaitpoint({
          type: 'WEBHOOK',
          responseToSend: response,
        });
        headers[RESUME_WEBHOOK_HEADER] = waitpoint.buildResumeUrl({
          queryParams: {
            created: new Date().toISOString(),
            runId: context.run.id,
          },
          sync: true,
        });
        context.run.waitForWaitpoint(waitpoint.id);
        return {
          nextWebhookUrl: headers[RESUME_WEBHOOK_HEADER],
        };
      }
      else {
        return {
          body: context.resumePayload.body,
          headers: context.resumePayload.headers,
          queryParams: context.resumePayload.queryParams,
        }
      }
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
  
