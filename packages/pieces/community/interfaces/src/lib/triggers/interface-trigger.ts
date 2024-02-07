import {
  Property,
  TriggerStrategy,
  createTrigger,
} from '@activepieces/pieces-framework';

const markdown = `
Go to this URL to see the interface: \n
\`{{interfaceUrl}}\`
`;

export const interfaceTrigger = createTrigger({
  name: 'interface_trigger',
  displayName: 'Interface',
  description: 'Trigger the flow through an interface.',
  props: {
    md: Property.MarkDown({
      value: markdown,
    }),
    inputs: Property.Array({
      displayName: 'Inputs',
      required: true,
      properties: {
        displayName: Property.ShortText({
          displayName: 'Name',
          description: 'The name will be used as the field label.',
          required: true,
        }),
        type: Property.StaticDropdown({
          displayName: 'Type',
          required: true,
          options: {
            options: [
              { value: 'text', label: 'Text' },
              { value: 'file', label: 'File' },
            ],
          },
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
        'If enabled, the interface will return the flow output to the frontend. Make sure to use the Return Response action to return a response.',
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
