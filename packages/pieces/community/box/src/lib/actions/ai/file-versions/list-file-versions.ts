import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';
import { boxUtils } from '../../../common/utils';

export const listFileVersionsAction = createAction({
  auth: boxAuth,
  name: 'box_list_file_versions',
  displayName: 'List File Versions',
  description: 'Lists the past versions of a Box file.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists one page of a file\'s past versions with their version IDs, for Get File Version, Promote File Version or Download File. The current version is not included (Get File shows it), and versions are tracked only on paid Box plans. Page with Offset.',
    idempotent: true,
  },
  props: {
    fileId: boxAiProps.fileId({ required: true }),
    limit: boxAiProps.limit({ required: false }),
    offset: boxAiProps.offset({ required: false }),
    fields: boxAiProps.fields({ required: false }),
  },
  async run({ auth, propsValue }) {
    return await boxClient.request({
      auth,
      method: HttpMethod.GET,
      path: `/files/${encodeURIComponent(propsValue.fileId)}/versions`,
      query: {
        limit: boxUtils.limitParam({ limit: propsValue.limit, max: 1000, fallback: 100 }),
        offset: boxUtils.optionalString({ value: propsValue.offset }),
        fields: propsValue.fields,
      },
    });
  },
});
