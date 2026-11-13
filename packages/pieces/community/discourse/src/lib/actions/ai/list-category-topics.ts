import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { discourseAuth } from '../../auth';
import { discourseRequest } from '../../common/client';
import { discourseInput } from '../../common/input';
import { discourseLists } from '../../common/lists';
import { discourseMap } from '../../common/mappers';
import { discourseSchemas } from '../../common/schemas';

export const listCategoryTopicsAction = createAction({
  auth: discourseAuth,
  name: 'list_category_topics',
  classification: 'SEARCH',
  displayName: 'List Category Topics',
  description: 'Lists the topics in a Discourse category, 30 per page.',
  audience: 'ai',
  aiMetadata: {
    description:
      'List topics in one Discourse category by numeric category ID (from List Categories), latest activity first, 30 per page starting at page 0. Read-only.',
    idempotent: true,
  },
  props: {
    category_id: Property.ShortText({ displayName: 'Category ID', description: 'Numeric category ID.', required: true }),
    page: Property.Number({ displayName: 'Page', description: 'Page number starting at 0.', required: false }),
  },
  outputSchema: discourseSchemas.topicPage,
  async run({ auth, propsValue }) {
    const id = discourseInput.id({ value: propsValue.category_id, label: 'Category ID' });
    const show = discourseMap.rec(
      await discourseRequest({ auth: auth.props, method: HttpMethod.GET, path: `/c/${id}/show.json` }),
    );
    const slug = discourseMap.str(discourseMap.rec(show['category'])['slug']) ?? 'category';
    return discourseLists.topicPage({
      auth: auth.props,
      path: `/c/${discourseInput.name({ value: slug, label: 'Category slug' })}/${id}.json`,
      page: propsValue.page,
    });
  },
});
