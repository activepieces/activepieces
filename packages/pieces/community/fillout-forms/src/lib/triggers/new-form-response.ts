import {
  createTrigger,
  TriggerStrategy,
  Property,
} from '@activepieces/pieces-framework';
import { formIdDropdown } from '../common/props';
import { filloutFormsAuth } from '../../index';
const markdown = `
To set up the trigger for new form responses, follow these steps:

1. **Open your Fillout form** in Edit mode
2. **Navigate to Integrations**: At the top of the form editor, click on the **Integrate** tab
3.  Scroll down to **Select Webhook**: In the Integrate tab, click on **Webhook**
4. **Add the webhook URL**: 
   - Click "Add new webhook"
   - Enter this URL in the webhook URL field:
   \`\`\`text
   {{webhookUrl}}
   \`\`\`
5. **Configure the webhook**:
   - Set the HTTP method to **POST**
   - Leave the headers empty (default is fine)
6. **Test the webhook**: Click **Test** to verify the connection
7. **Save the webhook**: Once verified, click **Finish Setup**

✅ **Important**: Make sure your selected form above matches the form you're setting up the webhook for.

Your flow will now trigger whenever someone submits your form!
`;
export const newFormResponse = createTrigger({
  auth: filloutFormsAuth,
  name: 'newFormResponse',
  displayName: 'New Form Response',
  description:
    'Fires when a new submission is received for a selected Fillout form.',
  props: {
    formId: formIdDropdown,
    instructions: Property.MarkDown({
      value: markdown,
    }),
  },
  sampleData: {
    questions: [
      {
        id: '5AtgG35AAZVcrSVfRubvp1',
        name: 'What is your name?',
        type: 'ShortAnswer',
        value: 'John Doe'
      },
      {
        id: 'gRBWVbE2fut2oiAMprdZpY',
        name: 'What is your email?',
        type: 'Email',
        value: 'john@example.com'
      },
      {
        id: 'hP4bHA1CgvyD2LKhBnnGHy',
        name: 'Pick your favorite color',
        type: 'MultipleChoice',
        value: 'Blue'
      }
    ],
    calculations: [
      {
        id: 'abcdef',
        name: 'Price',
        type: 'number',
        value: '12.50'
      }
    ],
    urlParameters: [
      {
        id: 'email',
        name: 'email',
        value: 'john@example.com'
      }
    ],
    submissionId: 'abc123',
    submissionTime: '2024-05-16T23:20:05.324Z'
  },
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    // Show instructions to the user to set up the webhook in Fillout
  },
  async onDisable(context) {
    // No action needed, as Fillout webhooks are managed manually
  },
  async run(context) {
    return [context.payload.body];
  },
});
