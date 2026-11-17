import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { villageAuth } from '../../common/auth';
import { villageApi } from '../../common/client';
import { villageSchemas } from '../../common/schemas';

export const updateList = createAction({
  auth: villageAuth,
  name: 'update_list',
  classification: 'WRITE',
  displayName: 'Update a list',
  description:
    "Update a list's metadata. Provide at least one of: title or description. The list type cannot be changed after creation.",
  audience: 'both',
  aiMetadata: {
    description:
      "Update an existing list's title and/or description by ID; at least one field must be supplied. Idempotent: applying the same values repeatedly yields the same result. The list type (people vs company) is fixed at creation and cannot be changed here.",
    idempotent: true,
  },
  outputSchema: villageSchemas.singleList,
  props: {
    id: Property.ShortText({
      displayName: 'List ID',
      description: 'List ID',
      required: true,
    }),
    title: Property.ShortText({
      displayName: 'Title',
      description: 'New list title',
      required: false,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'New list description. Leave blank to keep unchanged.',
      required: false,
    }),
  },
  async run(context) {
    const { id, title, description } = context.propsValue;

    const body: Record<string, unknown> = {};
    if (title !== undefined) body['title'] = title;
    if (description !== undefined) body['description'] = description;

    if (Object.keys(body).length === 0) {
      throw new Error('At least one field must be provided for update (title or description)');
    }

    const response = await villageApi.call({
      token: context.auth.secret_text,
      method: HttpMethod.PATCH,
      path: `/v2/lists/${encodeURIComponent(id)}`,
      body,
    });
    return response;
  },
});
