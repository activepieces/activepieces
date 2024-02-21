import {
  Property,
  TriggerStrategy,
  createTrigger,
} from '@activepieces/pieces-framework';

const markdown = `
The form title is same as the flow's title. \n
Form URL: \n
**{{formUrl}}**
`;

export const onFileSubmission = createTrigger({
  name: 'file_submission',
  displayName: 'Simple File Submission',
  description: 'Trigger the flow by submitting a file.',
  props: {
    about: Property.MarkDown({
      value: markdown,
    }),
    waitForResponse: Property.Checkbox({
      displayName: 'Wait for Response',
      description:
        'If enabled, the form will return the flow output to the frontend. Make sure to use the Return Response action to return a response.',
      defaultValue: true,
      required: true,
    }),
  },
  sampleData: {},
  type: TriggerStrategy.WEBHOOK,
  async onEnable() {
    return;
  },
  async onDisable() {
    return;
  },
  async run(context) {
    return [context.payload.body];
  },
});
