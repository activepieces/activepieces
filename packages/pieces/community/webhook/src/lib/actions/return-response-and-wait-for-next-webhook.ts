import {
    DynamicPropsValue,
    Property,
    createAction,
  } from '@activepieces/pieces-framework';
  import { ExecutionType, PauseType, StopResponse } from '@activepieces/shared';
  import { StatusCodes } from 'http-status-codes';
  
  enum ResponseType {
    JSON = 'json',
    RAW = 'raw',
    REDIRECT = 'redirect',
  }
  

  const RESUME_WEBHOOK_HEADER = 'x-activepieces-resume-webhook-url';
  export const returnResponseAndWaitForNextWebhook = createAction({
    name: 'return_response_and_wait_for_next_webhook',
    displayName: 'Respond and Wait for Next Webhook',
    description: 'return a response and wait for the next webhook to resume the flow',
    props: {
        markdown: Property.MarkDown({
            value: `**Respond and Wait for Next Webhook**<br> 
            Check the response header (${RESUME_WEBHOOK_HEADER}) for the next webhook URL and call it to resume the flow. <br>
            `,
          }),  
      responseType: Property.StaticDropdown({
        displayName: 'Response Type',
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
              required: false,
              defaultValue: 200,
            });
            fields['headers'] = Property.Object({
              displayName: 'Headers',
              required: false,
            });
          }
  
          switch (bodyTypeInput) {
            case ResponseType.JSON:
              fields['body'] = Property.Json({
                displayName: 'JSON Body',
                required: true,
              });
              break;
            case ResponseType.RAW:
              fields['body'] = Property.LongText({
                displayName: 'Raw Body',
                required: true,
              });
              break;
            case ResponseType.REDIRECT:
              fields['body'] = Property.LongText({
                displayName: 'Redirect URL',
                required: true,
              });
              break;
          }
          return fields;
        },
      }),
    },
  
    async run(context) {
      const { fields, responseType } = context.propsValue;
      const bodyInput = fields ['body'];
      const headers = fields['headers'] ?? {};
      headers[RESUME_WEBHOOK_HEADER] = context.generateResumeUrl({
        queryParams: {
          created: new Date().toISOString(),
          runId: context.run.id,
        },
        sync:true
      });
      const status = fields['status'];
      const response: StopResponse = {
        status: status ?? StatusCodes.OK,
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
          response.status = StatusCodes.MOVED_PERMANENTLY;
          response.headers = { ...response.headers, Location: ensureProtocol(bodyInput) };
          break;
      }
      
      
      if(context.executionType === ExecutionType.BEGIN){
        context.run.pause({
          pauseMetadata: {
            type: PauseType.WEBHOOK,
            response
          },
        });
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
  
