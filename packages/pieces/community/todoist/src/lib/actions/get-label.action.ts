import { createAction, Property } from '@activepieces/pieces-framework';
import { assertNotNullOrUndefined } from '@activepieces/pieces-framework';
import { todoistLabelsClient } from '../common/client/labels-client';
import { todoistAuth } from '../..';

export const todoistGetLabelAction = createAction({
  auth: todoistAuth,
  name: 'todoist_get_label',
  displayName: 'Get Label',
  description: 'Gets a single personal label by ID in Todoist.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Fetches a single personal Todoist label by label_id (full record: name, color, order, favorite). Use when you already have the ID and want its current state; to discover IDs from names list everything with List Labels or filter with Search Labels. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    label_id: Property.ShortText({
      displayName: 'Label ID',
      description: 'The ID of the personal label to fetch. Obtain it via List Labels or Search Labels.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const token = auth.access_token;
    const { label_id } = propsValue;

    assertNotNullOrUndefined(token, 'token');
    assertNotNullOrUndefined(label_id, 'label_id');
    return await todoistLabelsClient.get({ token, label_id });
  },
});
