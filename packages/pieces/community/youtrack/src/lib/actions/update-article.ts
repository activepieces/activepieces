import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { youtrackAuth } from '../auth';
import { ARTICLE_DETAIL_FIELDS, articleDetails, articleDropdown } from '../common';
import { youtrackClient } from '../common/client';
import { updateArticleActionOutputSchema } from '../output-schemas';

export const updateArticleAction = createAction({
  auth: youtrackAuth,
  name: 'update_article',
  classification: 'WRITE',
  outputSchema: updateArticleActionOutputSchema,
  displayName: 'Update Article',
  description: 'Updates the title or content of a Knowledge Base article.',
  audience: 'both',
  aiMetadata: {
    description:
      'Change the title and/or replace the Markdown content of a Knowledge Base article (ID from Search Articles); fields left empty are kept. Fails when nothing is given to change. Idempotent: sending the same values again leaves the article unchanged.',
    idempotent: true,
  },
  props: {
    article: articleDropdown,
    summary: Property.ShortText({ displayName: 'Title', description: 'New title. Leave empty to keep.', required: false }),
    content: Property.LongText({ displayName: 'Content', description: 'New content, replacing the old one. Supports Markdown. Leave empty to keep.', required: false }),
  },
  async run(context) {
    const body: Record<string, unknown> = {};
    const summary = youtrackClient.optionalText(context.propsValue.summary);
    if (summary !== undefined) body['summary'] = summary;
    const content = context.propsValue.content;
    if (content !== undefined && content !== null && content !== '') body['content'] = content;
    if (Object.keys(body).length === 0) {
      throw new Error('Nothing to update: set a Title or Content.');
    }
    const response = await youtrackClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.POST,
      path: `/articles/${youtrackClient.segment({ value: context.propsValue.article, label: 'Article' })}`,
      query: { fields: ARTICLE_DETAIL_FIELDS },
      body,
      operation: 'update the article',
    });
    return articleDetails(youtrackClient.recordOf(response));
  },
});
