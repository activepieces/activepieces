import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { facebookPagesAuth } from '../../auth';
import { facebookPagesCommon, GraphList, GraphRecord } from '../../common/common';
import { pagePhotosOutputSchema } from '../../output-schemas';

export const getPagePhotosAction = createAction({
  auth: facebookPagesAuth,
  name: 'get_page_photos',
  classification: 'SEARCH',
  displayName: 'Get Page Photos',
  description: 'Lists the photos uploaded by a Facebook Page.',
  audience: 'ai',
  aiMetadata: {
    description:
      'List the photos a Facebook Page has uploaded, newest first, with each photo ID, caption, created time, link, album and image sizes. Image URLs are temporary CDN links that expire. A photo ID is not a post ID. Paginated with After Cursor. Read-only.',
    idempotent: true,
  },
  outputSchema: pagePhotosOutputSchema,
  props: {
    pageId: facebookPagesCommon.pageId,
    limit: facebookPagesCommon.limit,
    after: facebookPagesCommon.after,
  },
  async run({ auth, propsValue }) {
    const response = await facebookPagesCommon.pageRequest<GraphList<GraphRecord>>({
      auth,
      pageId: propsValue.pageId,
      method: HttpMethod.GET,
      path: `${facebookPagesCommon.objectPath({ id: propsValue.pageId })}/photos`,
      queryParams: {
        type: 'uploaded',
        fields: 'id,name,created_time,updated_time,link,width,height,images,album{id,name}',
        ...facebookPagesCommon.cursorQuery({ limit: propsValue.limit, after: propsValue.after }),
      },
    });
    return facebookPagesCommon.toCursorPage({ response });
  },
});
