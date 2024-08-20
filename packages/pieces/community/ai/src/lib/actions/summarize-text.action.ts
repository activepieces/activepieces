import { createAction, Property } from '@activepieces/pieces-framework';

export const summarizeTextAction = createAction({
  name: 'summarize-text',
  displayName: 'Summarize Text',
  description: 'Enter a block of text and generate a summary.',
  props: {
    text: Property.LongText({
      displayName: 'Text to be Summarized',
      required: true,
    }),
  },
  async run(context) {},
});
