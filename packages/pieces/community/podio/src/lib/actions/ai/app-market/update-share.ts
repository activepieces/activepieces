import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioApi } from '../../../common/api';
import type { PodioShare } from '../../../common/types';
import { podioClient } from '../../../common/client';
import { podioUtils } from '../../../common/utils';

export const updateShareAction = createAction({
  auth: podioAuth,
  name: 'podio_update_share',
  displayName: 'Update Share',
  description: 'Updates the listing details of an app market share.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Updates the listing of a Podio app market share (name, abstract, description, language, categories, screenshots, video); only the props given are sent. The share id comes from Get Own Shares, category ids from List App Market Categories, file ids from Upload File.',
    idempotent: true,
  },
  props: {
    shareId: podioAiProps.id({ required: true, displayName: 'Share ID', description: 'The id of the share, from Get Own Shares.' }),
    name: podioAiProps.text({ required: false, displayName: 'Name', description: 'The name of the share; only used when the share is a space.' }),
    abstract: podioAiProps.text({ required: false, displayName: 'Abstract', description: 'A short summary of the share.' }),
    description: podioAiProps.longText({ required: false, displayName: 'Description', description: 'The full description of the share.' }),
    language: podioAiProps.text({ required: false, displayName: 'Language', description: 'The language the share is written in, such as "en".' }),
    categoryIds: podioAiProps.idList({ required: false, displayName: 'Category IDs', description: 'The ids of the categories to list it in, from List App Market Categories.' }),
    fileIds: podioAiProps.idList({ required: false, displayName: 'Screenshot File IDs', description: 'The ids of image files to show as screenshots, from Upload File.' }),
    video: podioAiProps.text({ required: false, displayName: 'Video', description: 'The YouTube id of an introduction video.' }),
  },
  async run({ auth, propsValue }) {
    const current = await podioApi.getShare({ auth, shareId: propsValue.shareId });
    return await podioClient.request<unknown>({
      auth,
      method: HttpMethod.PUT,
      path: `/app_store/${propsValue.shareId}`,
      body: podioUtils.body({
        values: {
          name: propsValue.name,
          abstract: propsValue.abstract ?? current.abstract ?? undefined,
          description: propsValue.description ?? current.description ?? undefined,
          language: propsValue.language ?? current.language ?? undefined,
          category_ids: numericIds({ ids: propsValue.categoryIds }) ?? currentCategoryIds({ share: current }),
          file_ids: numericIds({ ids: propsValue.fileIds }),
          video: propsValue.video,
        },
      }),
    });
  },
});

function currentCategoryIds({ share }: { share: PodioShare }): number[] {
  return Object.values(share.categories ?? {}).flatMap((categories) => categories.map((category) => category.category_id));
}

function numericIds({ ids }: { ids: unknown[] | undefined }): number[] | undefined {
  return ids && ids.length > 0 ? ids.map((id) => Number(id)) : undefined;
}
