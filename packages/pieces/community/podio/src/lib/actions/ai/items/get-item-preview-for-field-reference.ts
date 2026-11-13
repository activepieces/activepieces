import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioGetItemPreviewForFieldReferenceOutputSchema } from '../../../output-schemas';

export const getItemPreviewForFieldReferenceAction = createAction({
  auth: podioAuth,
  name: 'podio_get_item_preview_for_field_reference',
  outputSchema: podioGetItemPreviewForFieldReferenceOutputSchema,
  displayName: 'Get Item Preview for Field Reference',
  description: 'Gets a short preview of an item as it shows when referenced from an app field.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Returns the basic preview of an item (title, app, link, key values) as it appears when referenced from the given app-reference field. The item id comes from Find Referenceable Items or Get Item; the field id from Get App.',
    idempotent: true,
  },
  props: {
    itemId: podioAiProps.id({ required: true, displayName: 'Item ID', description: 'The id of the item, from Filter Items, Get Item or Create Item.' }),
    fieldId: podioAiProps.id({ required: true, displayName: 'Field ID', description: 'The id of the app-reference field the item would be referenced from, from Get App.' }),
  },
  async run({ auth, propsValue }) {
    return await podioClient.request<unknown>({ auth, method: HttpMethod.GET, path: `/item/${propsValue.itemId}/reference/${propsValue.fieldId}/preview` });
  },
});
