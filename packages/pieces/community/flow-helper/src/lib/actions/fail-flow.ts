import { createAction, Property } from '@activepieces/pieces-framework';

export const failFlow = createAction({
  name: 'failFlow',
  displayName: 'Fail Flow',
  description: 'Fails the flow execution with a custom message.',
  props: {
    message: Property.LongText({
      displayName: 'Error Message',
      description: 'The error message to show when the flow fails.',
      required: true,
    }),
  },
  async run(context) {
    throw new Error(context.propsValue.message);
  },
});
