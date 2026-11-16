import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioUtils } from '../../../common/utils';
import { podioShareAppOutputSchema } from '../../../output-schemas';

export const shareAppAction = createAction({
  auth: podioAuth,
  name: 'podio_share_app',
  outputSchema: podioShareAppOutputSchema,
  displayName: 'Share App',
  description: 'Publishes an app or space to the app market.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Publishes a Podio app or space to the app market, publicly or privately to the organization, and returns the new share id; each call creates another share. The app id comes from List Apps, the space id from Get Space, category ids from List App Market Categories, file ids from Upload File.',
    idempotent: false,
  },
  props: {
    refType: podioAiProps.choice({ required: true, displayName: 'Reference Type', description: 'What to share: "app" or "space" (a pack).', values: ['app', 'space'] }),
    refId: podioAiProps.id({ required: true, displayName: 'Reference ID', description: 'The id of the app or space, from List Apps or Get Space.' }),
    scope: podioAiProps.choice({ required: false, displayName: 'Scope', description: 'Who can see the share: "public" or "private". Defaults to "public".', values: ['public', 'private'] }),
    name: podioAiProps.text({ required: false, displayName: 'Name', description: 'The name of the share; only used when sharing a space.' }),
    abstract: podioAiProps.text({ required: false, displayName: 'Abstract', description: 'A short summary of the share.' }),
    description: podioAiProps.longText({ required: false, displayName: 'Description', description: 'The full description of the share.' }),
    language: podioAiProps.text({ required: false, displayName: 'Language', description: 'The language the share is written in, such as "en".' }),
    categoryIds: podioAiProps.idList({ required: false, displayName: 'Category IDs', description: 'The ids of the categories to list it in, from List App Market Categories.' }),
    fileIds: podioAiProps.idList({ required: false, displayName: 'Screenshot File IDs', description: 'The ids of image files to show as screenshots, from Upload File.' }),
    video: podioAiProps.text({ required: false, displayName: 'Video', description: 'The YouTube id of an introduction video.' }),
    features: podioAiProps.idList({ required: false, displayName: 'Features', description: 'The features to enable: "widgets", "tasks" and/or "filters".' }),
    children: podioAiProps.idList({ required: false, displayName: 'Child Share IDs', description: 'The ids of existing shares this share should include, from Get Own Shares.' }),
  },
  async run({ auth, propsValue }) {
    return await podioClient.request<unknown>({
      auth,
      method: HttpMethod.POST,
      path: '/app_store/',
      body: podioUtils.body({
        values: {
          scope: propsValue.scope,
          ref_type: propsValue.refType,
          ref_id: Number(propsValue.refId),
          name: propsValue.name,
          abstract: propsValue.abstract,
          description: propsValue.description,
          language: propsValue.language,
          category_ids: numericIds({ ids: propsValue.categoryIds }),
          file_ids: numericIds({ ids: propsValue.fileIds }),
          video: propsValue.video,
          features: propsValue.features && propsValue.features.length > 0 ? propsValue.features : undefined,
          children: numericIds({ ids: propsValue.children }),
        },
      }),
    });
  },
});

function numericIds({ ids }: { ids: unknown[] | undefined }): number[] | undefined {
  return ids && ids.length > 0 ? ids.map((id) => Number(id)) : undefined;
}
