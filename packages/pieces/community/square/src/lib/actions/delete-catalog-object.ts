import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { squareAuth } from '../auth';
import { squareClient } from '../common/client';
import { squareInputs } from '../common/inputs';
import { squareShape } from '../common/shape';
import { squareOutputSchemas } from '../output-schemas';

export const deleteCatalogObjectAction = createAction({
  name: 'delete_catalog_object',
  classification: 'DESTRUCTIVE',
  auth: squareAuth,
  displayName: 'Delete Catalog Item',
  description: 'Permanently deletes a catalog item (with all its variations) or a single variation.',
  audience: 'both',
  aiMetadata: {
    description:
      'Permanently deletes a Square catalog object by ID: an item ID deletes the item and all its variations; a variation ID deletes only that variation. Cannot be undone; a second call fails with not found.',
    idempotent: false,
  },
  props: {
    object_id: Property.ShortText({ displayName: 'Item or Variation ID', description: 'From Search Catalog Items.', required: true }),
  },
  outputSchema: squareOutputSchemas.deletedCatalog,
  async run(context) {
    const objectId = squareInputs.requireId({ value: context.propsValue.object_id, label: 'Item or Variation ID' });
    const body = await squareClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.DELETE,
      path: ['v2', 'catalog', 'object', objectId],
      operation: `delete catalog object "${objectId}"`,
    });
    return { id: objectId, deleted: true, deleted_object_ids: squareShape.strings({ value: body, key: 'deleted_object_ids' }), deleted_at: squareShape.str({ value: body, key: 'deleted_at' }) };
  },
});
