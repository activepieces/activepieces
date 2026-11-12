import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { youtrackAuth } from '../auth';
import { ARTICLE_DETAIL_FIELDS, articleDetails, projectDropdown, resolveProject } from '../common';
import { youtrackClient } from '../common/client';
import { createArticleActionOutputSchema } from '../output-schemas';

export const createArticleAction = createAction({
  auth: youtrackAuth,
  name: 'create_article',
  classification: 'WRITE',
  outputSchema: createArticleActionOutputSchema,
  displayName: 'Create Article',
  description: 'Creates a Knowledge Base article in a project.',
  audience: 'both',
  aiMetadata: {
    description:
      'Create a Knowledge Base article in a project (ID like "0-5" or short name) with a summary, optional Markdown content and optional parent article (ID from Search Articles). Not idempotent: each call creates another article, so check Search Articles first.',
    idempotent: false,
  },
  props: {
    project: projectDropdown,
    summary: Property.ShortText({ displayName: 'Title', description: 'The article title.', required: true }),
    content: Property.LongText({ displayName: 'Content', description: 'Optional article body. Supports Markdown.', required: false }),
    parentArticle: Property.ShortText({ displayName: 'Parent Article ID', description: 'Optional ID of the parent article (like "167-3" or "APT-A-1"), from Search Articles.', required: false }),
  },
  async run(context) {
    const summary = youtrackClient.optionalText(context.propsValue.summary);
    if (summary === undefined) {
      throw new Error('Title is required.');
    }
    const projectValue = youtrackClient.optionalText(context.propsValue.project) ?? '';
    const projectId = youtrackClient.isDatabaseId(projectValue)
      ? projectValue
      : (await resolveProject({ auth: context.auth, value: projectValue })).id;
    const body: Record<string, unknown> = { project: { id: projectId }, summary };
    const content = context.propsValue.content;
    if (content !== undefined && content !== null && content !== '') body['content'] = content;
    const parent = youtrackClient.optionalText(context.propsValue.parentArticle);
    if (parent !== undefined) {
      const parentArticle = youtrackClient.recordOf(await youtrackClient.request<unknown>({
        auth: context.auth,
        method: HttpMethod.GET,
        path: `/articles/${youtrackClient.segment({ value: parent, label: 'Parent Article ID' })}`,
        query: { fields: 'id' },
        operation: 'read the parent article',
      }));
      body['parentArticle'] = { id: parentArticle['id'] ?? parent };
    }
    const response = await youtrackClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.POST,
      path: '/articles',
      query: { fields: ARTICLE_DETAIL_FIELDS },
      body,
      operation: 'create the article',
    });
    return articleDetails(youtrackClient.recordOf(response));
  },
});
