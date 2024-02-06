import { Property, createAction } from '@activepieces/pieces-framework';
import { StatusCodes } from 'http-status-codes';

export const returnResponse = createAction({
  name: 'return_response',
  displayName: 'Return Response',
  description: 'Return a response',
  props: {
    type: Property.StaticDropdown({
      displayName: 'Type',
      required: true,
      options: {
        options: [
          { value: 'markdown', label: 'Markdown' },
          { value: 'file', label: 'File' },
        ],
      },
    }),
    value: Property.DynamicProperties({
      displayName: 'Value',
      refreshers: ['type'],
      required: true,
      props: async (propsValue) => {
        if (!propsValue['type']) {
          return {};
        }

        const fields: any = {};

        if ((propsValue['type'] as unknown as string) === 'markdown') {
          fields['markdown'] = Property.ShortText({
            displayName: 'Markdown',
            required: true,
          });
        } else {
          fields['file'] = Property.File({
            displayName: 'File',
            required: true,
          });
        }

        return fields;
      },
    }),
  },

  async run({ propsValue, run }) {
    const { type, value } = propsValue;
    const body = {
      type,
      value: type === 'markdown' ? value['markdown'] : value['file'],
    };

    const response = {
      status: StatusCodes.OK,
      body: body,
      headers: {},
    };

    run.stop({
      response: response,
    });
    return response;
  },
});
