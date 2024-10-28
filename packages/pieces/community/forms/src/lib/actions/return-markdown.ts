import { Property, createAction } from '@activepieces/pieces-framework';
import { StatusCodes } from 'http-status-codes';

export const returnMarkdown = createAction({
  name: 'return_markdown',
  displayName: 'Respond on UI (Markdown)',
  description: 'Return a markdown as a response.',
  props: {
    markdown: Property.LongText({
      displayName: 'Markdown',
      required: true,
    }),
  },
  errorHandlingOptions: {
    retryOnFailure: {
      hide: true,
    },
    continueOnFailure: {
      hide: true,
    }
  },
  async run({ propsValue, run }) {

    const response = {
      status: StatusCodes.OK,
      body: {
        type: 'markdown',
        value: propsValue.markdown,
      },
      headers: {},
    };

    run.stop({
      response: response,
    });
    return response;
  },
});
