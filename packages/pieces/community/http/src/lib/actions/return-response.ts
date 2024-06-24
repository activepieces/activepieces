import {
  DynamicPropsValue,
  Property,
  createAction,
} from '@activepieces/pieces-framework';
import { StopResponse } from '@activepieces/shared';
import { StatusCodes } from 'http-status-codes';

export const httpReturnResponse = createAction({
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
    body_type: Property.StaticDropdown({
      displayName: 'Body Type',
      required: false,
      defaultValue: 'json',
      options: {
        disabled: false,
        options: [
          {
            label: 'JSON',
            value: 'json',
          },
          {
            label: 'Raw',
            value: 'raw',
          },
        ],
      },
    }),
    body: Property.DynamicProperties({
      displayName: 'Response',
      refreshers: ['body_type'],
      required: true,
      props: async ({ body_type }) => {
        if (!body_type) return {};

        const bodyTypeInput = body_type as unknown as string;

        const fields: DynamicPropsValue = {};

        switch (bodyTypeInput) {
          case 'json':
            fields['data'] = Property.Json({
              displayName: 'JSON Body',
              required: true,
            });
            break;
          case 'raw':
            fields['data'] = Property.LongText({
              displayName: 'Raw Body',
              required: true,
            });
            break;
        }
        return fields;
      },
    }),
  },

  async run(context) {
    const { status, body, body_type, headers } = context.propsValue;
    const bodyInput = body['data'];

    const response: StopResponse = {
      status: status ?? StatusCodes.OK,
      headers: (headers as Record<string, string>) ?? {},
    };

    if (body_type == 'json') {
      response.body = JSON.parse(bodyInput);
    } else {
      response.body = bodyInput;
    }

    context.run.stop({
      response: response,
    });
    return response;
  },
});
