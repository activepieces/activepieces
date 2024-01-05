import {
  Property,
  TriggerStrategy,
  createTrigger,
} from '@activepieces/pieces-framework';

const markdown = `
- Go to the "Integration" section.
- Find and click on the "Webhook" plugin to activate it.
- Add a webhook to that form.
- In the webhook settings, paste this URL: 
  \`{{webhookUrl}}\`
`;

export const newPost = createTrigger({
  name: 'new_post_on_beamer',
  displayName: 'New Beamer Post',
  description: 'Triggers when new post is found in your beamer account',
  props: {
    md: Property.MarkDown({
      value: markdown,
    }),
  },
  type: TriggerStrategy.WEBHOOK,
  sampleData: {},

  async onEnable(context) {
    // IGNORED
  },
  async onDisable(context) {
    // IGNORED
  },
  async run(context) {
    return [context.payload.body];
  },
});
