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
    status: Property.Number({
      displayName: 'Status',
      required: false,
      defaultValue: 200,
    }),
    headers: Property.Object({
      displayName: 'Headers',
      required: false,
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
    body: Property.DynamicProperties({
      displayName: 'Response',
      refreshers: ['responseType'],
      required: true,
      props: async ({ responseType }) => {
        if (!responseType) return {};

        const bodyTypeInput = responseType as unknown as ResponseType;

        const fields: DynamicPropsValue = {};

        switch (bodyTypeInput) {
          case ResponseType.JSON:
            fields['data'] = Property.Json({
              displayName: 'JSON Body',
              required: true,
            });
            break;
          case ResponseType.RAW:
            fields['data'] = Property.LongText({
              displayName: 'Raw Body',
              required: true,
            });
            break;
          case ResponseType.REDIRECT:
            fields['data'] = Property.LongText({
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
    const { status, body, responseType, headers } = context.propsValue;
    const bodyInput = body['data'];

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
        (response.status = StatusCodes.MOVED_PERMANENTLY),
          (response.headers = { ...response.headers, Location: bodyInput });
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
