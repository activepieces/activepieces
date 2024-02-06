import {
  Property,
  TriggerStrategy,
  createTrigger,
} from '@activepieces/pieces-framework';

export const interfaceTrigger = createTrigger({
  name: 'interface_trigger',
  displayName: 'Interface',
  description: 'Trigger the flow through an interface.',
  props: {
    textInputs: Property.Array({
      displayName: 'Text Inputs',
      required: true,
      properties: {
        displayName: Property.ShortText({
          displayName: 'Name',
          description: 'The name will be used as the field label.',
          required: true,
        }),
        placeholder: Property.ShortText({
          displayName: 'Placeholder',
          description: 'Placeholder text for the input field.',
          required: false,
        }),
        description: Property.ShortText({
          displayName: 'Description',
          description: 'Description text that appears under the input field.',
          required: false,
        }),
        required: Property.Checkbox({
          displayName: 'Required',
          description: 'If checked, the input field will be required.',
          required: true,
        }),
      },
    }),
    fileInputs: Property.Array({
      displayName: 'File Inputs',
      required: true,
      properties: {
        displayName: Property.ShortText({
          displayName: 'Name',
          description: 'The name will be used as the field label.',
          required: true,
        }),
        description: Property.ShortText({
          displayName: 'Description',
          description: 'Description text that appears under the input field.',
          required: false,
        }),
        required: Property.Checkbox({
          displayName: 'Required',
          description: 'If checked, the input field will be required.',
          required: true,
        }),
      },
    }),
    waitForResponse: Property.Checkbox({
      displayName: 'Wait for Response',
      description:
        'If enabled, the interface will return the flow output to the frontend. Make sure to use HTTP Piece -> Return Response action to return the response.',
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
