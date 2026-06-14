import { createAction, Property } from '@activepieces/pieces-framework';
import { defaultSchema } from '@atlaskit/adf-schema/schema-default';
import { JSONTransformer } from '@atlaskit/editor-json-transformer';
import { MarkdownTransformer } from '@atlaskit/editor-markdown-transformer';

export const markdownToJiraFormat = createAction({
  name: 'markdownToJiraFormat',
  displayName: 'Markdown to Jira format',
  description:
    "Convert Markdown-formatted text to Jira's ADF syntax for use in comments and descriptions etc",
  audience: 'both',
  aiMetadata: {
    description:
      'Convert markdown text into an Atlassian Document Format (ADF) JSON document, locally with no API call or auth needed. Use before Add/Update Issue Comment or rich-text issue fields whenever content is authored in markdown, since Jira Cloud rich text requires ADF. Pure transformation, fully idempotent.',
    idempotent: true,
  },
  requireAuth: false,
  props: {
    markdown: Property.LongText({
      displayName: 'Markdown text',
      required: true,
    }),
  },
  errorHandlingOptions: {
    continueOnFailure: {
      defaultValue: false,
    },
    retryOnFailure: {
      hide: true,
    },
  },
  async run({ propsValue }) {
    const jsonTransformer = new JSONTransformer();
    const markdownTransformer = new MarkdownTransformer(defaultSchema as any);

    const adfDocument = jsonTransformer.encode(
      markdownTransformer.parse(propsValue.markdown)
    );

    return adfDocument;
  },
});
