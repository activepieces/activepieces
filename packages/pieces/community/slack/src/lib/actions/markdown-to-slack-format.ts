import {
  createAction,
  Property,
} from '@activepieces/pieces-framework';
import slackifyMarkdown from 'slackify-markdown';

export const markdownToSlackFormat = createAction({
  name: 'markdownToSlackFormat',
  displayName: 'Markdown to Slack format',
  description:
    "Convert Markdown-formatted text to Slack's pseudo - markdown syntax",
  audience: 'both',
  aiMetadata: { description: "Convert standard Markdown into Slack's mrkdwn dialect so links, bold, and lists render correctly in messages; a pure local text transform that needs no auth and is fully repeatable for the same input. Use this to prepare text before sending it through a Slack message action.", idempotent: true },
  requireAuth: false,
  props: {
    markdown: Property.LongText({
      displayName: 'Markdown text',
      required: true,
    }),
  },

  async run({ propsValue }) {
    return slackifyMarkdown(propsValue.markdown);
  },
});
