import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { discourseAuth } from '../../auth';
import { discourseRequest } from '../../common/client';
import { discourseInput } from '../../common/input';
import { discourseMap } from '../../common/mappers';
import { discourseOps } from '../../common/operations';
import { discourseSchemas } from '../../common/schemas';

export const getCategoryAction = createAction({
  auth: discourseAuth,
  name: 'get_category',
  classification: 'READ',
  displayName: 'Get Category',
  description: 'Returns a Discourse category by ID.',
  audience: 'ai',
  aiMetadata: {
    description: 'Get one Discourse category by numeric category ID: name, slug, colors, description, parent and counts. Read-only.',
    idempotent: true,
  },
  props: {
    category_id: Property.ShortText({ displayName: 'Category ID', description: 'Numeric category ID.', required: true }),
  },
  outputSchema: discourseSchemas.category,
  async run({ auth, propsValue }) {
    const id = discourseInput.id({ value: propsValue.category_id, label: 'Category ID' });
    const body = discourseMap.rec(
      await discourseRequest({ auth: auth.props, method: HttpMethod.GET, path: `/c/${id}/show.json` }),
    );
    return discourseMap.category({ raw: body['category'], baseUrl: discourseOps.baseUrl(auth.props) });
  },
});
