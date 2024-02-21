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

export const onFormSubmission = createTrigger({
  name: 'form_submission',
  displayName: 'On Form Submission',
  description: 'Trigger the flow by submitting a form.',
  props: {
    about: Property.MarkDown({
      value: markdown,
    }),
    inputs: Property.Array({
      displayName: 'Inputs',
      required: true,
      properties: {
        displayName: Property.ShortText({
          displayName: 'Field Name',
          required: true,
        }),
        type: Property.StaticDropdown({
          displayName: 'Field Type',
          required: true,
          options: {
            options: [
              { value: 'text', label: 'Text' },
              { value: 'text_area', label: 'Text Area' },
              { value: 'file', label: 'File' },
              { value: 'toggle', label: 'Toggle' },
            ],
          },
        }),
        description: Property.ShortText({
          displayName: 'Field Description',
          required: false,
        }),
        required: Property.Checkbox({
          displayName: 'Required',
          required: true,
        }),
      },
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
