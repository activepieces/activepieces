import { createAction, Property } from '@activepieces/pieces-framework';
import { KnowledgeArticleSchema } from '../common/types';
import { createServiceNowClient, servicenowAuth } from '../common/props';

export const getKnowledgeArticleAction = createAction({
  auth: servicenowAuth,
  name: 'get_knowledge_article',
  displayName: 'Get Knowledge Article',
  description:
    'Retrieve the full content of a knowledge article by sys_id',
  props: {
    article_sys_id: Property.ShortText({
      displayName: 'Article Sys ID',
      description:
        'sys_id of the article. Use "Search Knowledge Articles" first if you only have a KB number.',
      required: true,
    }),
    update_view: Property.Checkbox({
      displayName: 'Increment View Count',
      description:
        'Whether to increment the article view counter when fetching',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const { article_sys_id, update_view } = context.propsValue;
    const client = createServiceNowClient(context.auth);

    const result = await client.getKnowledgeArticle({
      article_sys_id,
      update_view,
    });

    return KnowledgeArticleSchema.parse(result);
  },
});
