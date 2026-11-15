import { createAction, Property } from '@activepieces/pieces-framework';
import { mondayAuth } from '../../../auth';
import { mondayApi } from '../../../common/monday-api';
import { makeClient } from '../../../common';
import { getAssetsActionOutputSchema } from '../../../output-schemas';

export const getAssetsAction = createAction({
  auth: mondayAuth,
  name: 'monday_get_assets',
  classification: 'READ',
  displayName: 'Get Assets',
  description: 'Gets file (asset) metadata and download links by asset ID.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Fetch metadata for monday.com files (assets) by ID: name, size, extension, uploader, an account-restricted URL and a public URL valid for about one hour. Asset IDs appear in file column values (from Get Items) and in upload results. Read-only and safe to retry.',
    idempotent: true,
  },
  outputSchema: getAssetsActionOutputSchema,
  props: {
    asset_ids: Property.Array({
      displayName: 'Asset IDs',
      description: 'Numeric asset IDs.',
      required: true,
    }),
  },
  async run(context) {
    const ids = mondayApi.toStringArray(context.propsValue.asset_ids);
    if (ids.length === 0) {
      throw new Error('Provide at least one asset ID.');
    }

    const data = await makeClient(context.auth).query<{ assets: MondayAsset[] }>({
      query: `query ($ids: [ID!]!) {
        assets(ids: $ids) {
          id
          name
          url
          public_url
          url_thumbnail
          file_extension
          file_size
          created_at
          uploaded_by { id name }
        }
      }`,
      variables: { ids },
    });

    const assets = data.assets.map((asset) => ({
      id: asset.id,
      name: asset.name,
      url: asset.url,
      public_url: asset.public_url,
      thumbnail_url: asset.url_thumbnail ?? null,
      file_extension: asset.file_extension,
      file_size: asset.file_size,
      created_at: asset.created_at ?? null,
      uploaded_by_id: asset.uploaded_by?.id ?? null,
      uploaded_by_name: asset.uploaded_by?.name ?? null,
    }));

    return { assets, count: assets.length };
  },
});

type MondayAsset = {
  id: string;
  name: string;
  url: string;
  public_url: string;
  url_thumbnail: string | null;
  file_extension: string;
  file_size: number;
  created_at: string | null;
  uploaded_by: { id: string; name: string } | null;
};
