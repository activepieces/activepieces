import {
  Property,
  TriggerStrategy,
  createTrigger,
} from '@activepieces/pieces-framework';
import {
  createKeyForFormInput,
  MarkdownVariant,
  USE_DRAFT_QUERY_PARAM_NAME,
} from '@activepieces/shared';

const markdown = `**Published Form URL:**
\`\`\`text
{{formUrl}}
\`\`\`
Use this for production, views the published version of the form.
<br>
<br>
**Draft Form URL:**
\`\`\`text
{{formUrl}}?${USE_DRAFT_QUERY_PARAM_NAME}=true
\`\`\`
Use this to generate sample data, views the draft version of the form (the one you are editing now).
`;
const responseMarkdown = `
If **Wait for Response** is enabled, use **Respond on UI** in your flow to provide a response back to the form.
`;

type FormInput = {
  displayName: string;
  type: 'text' | 'text_area' | 'file' | 'toggle';
  description?: string;
  required: boolean;
};

const parseBoolean = (value: unknown, fieldName: string): boolean => {
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'string') {
    const lowerValue = value.toLowerCase();
    if (lowerValue === 'true' || lowerValue === 'false') {
      return lowerValue === 'true';
    }
  }
  throw new Error(
    `Field ${fieldName} must be a boolean or 'true'/'false' string`
  );
};

export const onFormSubmission = createTrigger({
  name: 'form_submission',
  displayName: 'Web Form',
  description: 'Trigger the flow by submitting a form.',
  props: {
    about: Property.MarkDown({
      value: markdown,
      variant: MarkdownVariant.BORDERLESS,
    }),
    response: Property.MarkDown({
      value: responseMarkdown,
      variant: MarkdownVariant.WARNING,
    }),
    waitForResponse: Property.Checkbox({
      displayName: 'Wait for Response',
      defaultValue: false,
      required: true,
    }),
    note: Property.MarkDown({
      value:
        'Note: The Filed Name must be unique. if same field name is used multiple times, then rest filed name will be like fieldName_1, fieldName_2 etc.',
      variant: MarkdownVariant.WARNING,
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
    const payload = context.payload.body as Record<string, unknown>;
    const inputs = context.propsValue.inputs as FormInput[];

    const processedPayload: Record<string, unknown> = {};
    const keyCounts: Record<string, number> = {};

    for (const input of inputs) {
      const baseKey = createKeyForFormInput(input.displayName);
      if (keyCounts[baseKey] === undefined) {
        keyCounts[baseKey] = 0;
      } else {
        keyCounts[baseKey]++;
      }

      const keyCountForThisKey = keyCounts[baseKey];
      const key =
        keyCountForThisKey === 0 ? baseKey : `${baseKey}_${keyCountForThisKey}`;
      const value = payload[key];

      switch (input.type) {
        case 'toggle':
          processedPayload[key] = parseBoolean(value, input.displayName);
          break;
        case 'text':
        case 'text_area':
        case 'file':
          processedPayload[key] = value;
          break;
      }
    }

    return [processedPayload];
  },
});
