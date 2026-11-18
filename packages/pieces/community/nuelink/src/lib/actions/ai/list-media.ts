import { createAction, Property } from '@activepieces/pieces-framework';
import { nuelinkAuths } from '../../auth';
import { nuelinkAiProps } from '../../common/ai-props';
import { nuelinkOutputSchemas } from '../../output-schemas';
import { nuelinkClient } from '../../common/client';
import { nuelinkInputs } from '../../common/inputs';
import { MEDIA_TYPES } from '../../common/operations';
import { nuelinkProps } from '../../common/props';

export const aiListMedia = createAction({
  name: 'nuelink_list_media',
  classification: 'SEARCH',
  auth: nuelinkAuths,
  displayName: 'List Media',
  description: 'Lists the files in a brand\'s Nuelink media library, newest first.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists the brand media library (id, name, MIME type, size, dates), newest first, optionally filtered by type. Reuse an item\'s id in the media list of nuelink_create_post instead of uploading the file again with nuelink_upload_file. One page per call with hasMore. Read-only.',
    idempotent: true,
  },
  props: {
    brandId: nuelinkAiProps.brandId(),
    type: Property.StaticDropdown({
      displayName: 'Type',
      description: 'Only this media category. APPLICATION covers every document record; DOCUMENT only office/document MIME types.',
      required: false,
      options: { options: MEDIA_TYPES.map((value) => ({ label: value, value })) },
    }),
    page: nuelinkProps.page(),
    perPage: nuelinkProps.perPage(),
  },
  outputSchema: nuelinkOutputSchemas.listMedia,
  async run(context) {
    const apiKey = nuelinkClient.apiKeyOf({ auth: context.auth });
    const brandId = nuelinkClient.numericId({ value: context.propsValue.brandId, label: 'Brand ID' });
    const type = nuelinkInputs.oneOf({ value: context.propsValue.type, label: 'Type', allowed: MEDIA_TYPES });
    const { page, perPage } = nuelinkInputs.paging({ page: context.propsValue.page, perPage: context.propsValue.perPage });
    return nuelinkClient.getPage({ apiKey, path: ['brands', brandId, 'media'], query: { type }, page, perPage });
  },
});
