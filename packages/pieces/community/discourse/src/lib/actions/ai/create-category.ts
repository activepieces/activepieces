import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { discourseAuth } from '../../auth';
import { discourseRequest } from '../../common/client';
import { discourseInput } from '../../common/input';
import { discourseMap } from '../../common/mappers';
import { discourseOps } from '../../common/operations';
import { discourseSchemas } from '../../common/schemas';

export const createCategoryAction = createAction({
  auth: discourseAuth,
  name: 'create_category',
  classification: 'WRITE',
  displayName: 'Create Category',
  description: 'Creates a Discourse category.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Create a new Discourse category, optionally as a subcategory of a parent category ID, with hex colors. Needs an admin key. Names must be unique, so a retry after success fails with a "name already taken" error rather than duplicating.',
    idempotent: false,
  },
  props: {
    name: Property.ShortText({ displayName: 'Name', required: true }),
    color: Property.ShortText({ displayName: 'Color', description: 'Hex color without #, for example 0088CC.', required: false }),
    text_color: Property.ShortText({ displayName: 'Text Color', description: 'Hex color without #, for example FFFFFF.', required: false }),
    parent_category_id: Property.ShortText({ displayName: 'Parent Category ID', required: false }),
  },
  outputSchema: discourseSchemas.category,
  async run({ auth, propsValue }) {
    const name = discourseInput.text({ value: propsValue.name, label: 'Name' });
    const color = hexColor({ value: propsValue.color, label: 'Color' });
    const textColor = hexColor({ value: propsValue.text_color, label: 'Text Color' });
    const parent = discourseInput.optionalId({ value: propsValue.parent_category_id, label: 'Parent Category ID' });
    const body = discourseMap.rec(
      await discourseRequest({
        auth: auth.props,
        method: HttpMethod.POST,
        path: '/categories.json',
        body: {
          name,
          color: color ?? '0088CC',
          text_color: textColor ?? 'FFFFFF',
          ...(parent === undefined ? {} : { parent_category_id: Number(parent) }),
        },
      }),
    );
    return discourseMap.category({ raw: body['category'], baseUrl: discourseOps.baseUrl(auth.props) });
  },
});

function hexColor({ value, label }: { value: unknown; label: string }): string | undefined {
  const text = discourseInput.optionalText(value)?.replace(/^#/, '');
  if (text === undefined) {
    return undefined;
  }
  if (!/^[0-9a-fA-F]{3}([0-9a-fA-F]{3})?$/.test(text)) {
    throw new Error(`${label} must be a hex color such as 0088CC.`);
  }
  return text.toUpperCase();
}
