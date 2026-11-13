import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { AssetResponse, canvaAuth, MAX_ASSET_NAME_LENGTH } from '../../common';
import { canvaClient } from '../../common/client';
import { canvaOutputSchemas } from '../../common/output-schemas';

export const canvaUpdateAssetAi = createAction({
  auth: canvaAuth,
  name: 'canva_update_asset',
  displayName: 'Update Asset',
  description: 'Renames a Canva asset or replaces its tags.',
  audience: 'ai',
  classification: 'WRITE',
  outputSchema: canvaOutputSchemas.aiAsset,
  aiMetadata: {
    description:
      'Changes the name and/or tags of an image or video in the Canva library. tags REPLACES all existing tags (send the full list); set clearTags to remove every tag. Omitted fields are left unchanged. Returns the updated asset. Repeating the same update gives the same result.',
    idempotent: true,
  },
  props: {
    assetId: Property.ShortText({ displayName: 'Asset ID', description: 'The Canva asset ID.', required: true }),
    name: Property.ShortText({ displayName: 'Name', description: `New name, max ${MAX_ASSET_NAME_LENGTH} characters. Empty leaves it unchanged.`, required: false }),
    tags: Property.Array({ displayName: 'Tags', description: 'Full replacement list of tags (max 50). Empty leaves tags unchanged.', required: false }),
    clearTags: Property.Checkbox({ displayName: 'Clear Tags', description: 'Remove all tags from the asset.', required: false, defaultValue: false }),
  },
  async run(context) {
    const { assetId, name, tags, clearTags } = context.propsValue;
    const id = assetId.trim();
    if (!id) {
      throw new Error('Asset ID is required.');
    }
    const body: { name?: string; tags?: string[] } = {};
    const trimmedName = name?.trim();
    if (trimmedName) {
      if (trimmedName.length > MAX_ASSET_NAME_LENGTH) {
        throw new Error(`Name must be ${MAX_ASSET_NAME_LENGTH} characters or fewer.`);
      }
      body.name = trimmedName;
    }
    const tagList = (tags ?? []).map((t) => String(t).trim()).filter((t) => t.length > 0);
    if (clearTags === true && tagList.length > 0) {
      throw new Error('Give tags or set Clear Tags, not both.');
    }
    if (clearTags === true) {
      body.tags = [];
    } else if (tagList.length > 0) {
      if (tagList.length > 50) {
        throw new Error('An asset can have at most 50 tags.');
      }
      body.tags = tagList;
    }
    if (body.name === undefined && body.tags === undefined) {
      throw new Error('Nothing to update. Give a name, tags, or set Clear Tags.');
    }
    const response = await canvaClient.request<AssetResponse>({
      token: context.auth.access_token,
      method: HttpMethod.PATCH,
      path: `/assets/${encodeURIComponent(id)}`,
      body,
    });
    return { asset: response.asset };
  },
});
