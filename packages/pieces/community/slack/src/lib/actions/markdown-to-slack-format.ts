import {
  createAction,
  Property,
} from '@activepieces/pieces-framework';
import slackifyMarkdown from 'slackify-markdown';

export const markdownToSlackFormat = createAction({
  name: 'markdownToSlackFormat',
  classification: 'READ',
  displayName: 'Markdown to Slack Format',
  description: "Converts Markdown text to Slack's mrkdwn syntax.",
  audience: 'both',
  aiMetadata: { description: "Convert standard Markdown into Slack's mrkdwn dialect so links, bold, and lists render correctly in messages; a pure local text transform that needs no auth and is fully repeatable for the same input. Use this to prepare text before sending it through a Slack message action.", idempotent: true },
  requireAuth: false,
  props: {
    markdown: Property.LongText({
      displayName: 'Markdown Text',
      description: 'Converted to Slack mrkdwn for use in a message.',
      placeholder: '**bold** and _italic_',
      required: true,
    }),
  },

  async run({ propsValue }) {
    return slackifyMarkdown(propsValue.markdown);
  },
});
