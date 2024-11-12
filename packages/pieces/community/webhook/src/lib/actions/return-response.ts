import {
  DynamicPropsValue,
  Property,
  createAction,
} from '@activepieces/pieces-framework';
import { StopResponse } from '@activepieces/shared';
import { StatusCodes } from 'http-status-codes';

enum ResponseType {
  JSON = 'json',
  RAW = 'raw',
  REDIRECT = 'redirect',
}

export const returnResponse = createAction({
  name: 'return_response',
  displayName: 'Return Response',
  description: 'return a response',
  props: {
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
    const headers = fields['headers'];
    const status = fields['status'];
    
    const response: StopResponse = {
      status: status ?? StatusCodes.OK,
      headers: (headers as Record<string, string>) ?? {},
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
        response.headers = { ...response.headers, Location: bodyInput };
        break;
    }

    context.run.stop({
      response: response,
    });
    return response;
  },
});

function praseToJson(body: unknown) {
  if (typeof body === 'string') {
    return JSON.parse(body);
  }
  return JSON.parse(JSON.stringify(body));
}
