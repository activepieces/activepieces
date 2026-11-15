import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { alttextifyAuth } from '../common/auth';
import { alttextifyApi } from '../common/client';
import { alttextifySchemas } from '../common/schemas';

export const deleteImageAction = createAction({
  name: 'delete-image',
  classification: 'DESTRUCTIVE',
  auth: alttextifyAuth,
  displayName: 'Delete Image',
  description: 'Marks an AltTextify image as deleted. It can still appear in Get Alt Text and List Images.',
  audience: 'both',
  aiMetadata: {
    description:
      'Deletes one AltTextify image record by asset_id. AltTextify marks the image as deleted (status DELETED); it can still appear in Get Alt Text and List Images. Does not refund credits. Repeating the call on the same ID returns the same result. Fails if no image has this asset_id.',
    idempotent: true,
  },
  props: {
    asset_id: Property.ShortText({
      displayName: 'Asset ID',
      description: 'ID of the image record to delete.',
      required: true,
    }),
  },
  outputSchema: alttextifySchemas.deleteImage,
  async run(context) {
    const assetId = context.propsValue.asset_id.trim();
    if (!assetId) {
      throw new Error('Asset ID is required.');
    }
    const response = await alttextifyApi.request<unknown>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.DELETE,
      path: `/image/${encodeURIComponent(assetId)}`,
      operation: 'delete image',
    });
    if (isEmptyBody(response)) {
      throw new Error('AltTextify has no image with this asset ID (nothing was deleted).');
    }
    const status =
      response !== null && typeof response === 'object' && 'status' in response && typeof response.status === 'string'
        ? response.status
        : null;
    return { deleted: true, asset_id: assetId, status };
  },
});

function isEmptyBody(body: unknown): boolean {
  if (body === null || body === undefined) return true;
  if (typeof body === 'string') return body.trim().length === 0;
  if (Array.isArray(body)) return body.length === 0;
  if (typeof body === 'object') return Object.keys(body).length === 0;
  return false;
}
