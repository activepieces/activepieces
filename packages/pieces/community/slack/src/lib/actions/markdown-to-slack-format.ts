import {
  createAction,
  PieceAuth,
  Property,
} from '@activepieces/pieces-framework';
import slackifyMarkdown from 'slackify-markdown';

export const markdownToSlackFormat = createAction({
  name: 'markdownToSlackFormat',
  displayName: 'Markdown to Slack format',
  description:
    "Convert Markdown-formatted text to Slack's pseudo - markdown syntax",
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
