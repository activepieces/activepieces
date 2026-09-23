import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { facebookPagesAuth } from '../../auth';
import { facebookPagesCommon, GraphRecord } from '../../common/common';
import { postOutputSchema } from '../../output-schemas';

const POST_FIELDS =
  'id,message,created_time,updated_time,permalink_url,status_type,full_picture,is_published,scheduled_publish_time,attachments{media_type,type,title,description,url,media}';

export const getPostAction = createAction({
  auth: facebookPagesAuth,
  name: 'get_post',
  classification: 'READ',
  displayName: 'Get Post',
  description: 'Gets one post from a Facebook Page.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Get one Facebook Page post by its PageID_PostID: message, created and updated time, permalink, main picture, publish status, scheduled time and attachments. Use Get Post Reactions for reaction counts. Use Fields to request other Graph API post fields. Read-only.',
    idempotent: true,
  },
  outputSchema: postOutputSchema,
  props: {
    pageId: facebookPagesCommon.pageId,
    postId: facebookPagesCommon.postId,
    fields: facebookPagesCommon.fields({ defaultFields: POST_FIELDS }),
  },
  async run({ auth, propsValue }) {
    return facebookPagesCommon.pageRequest<GraphRecord>({
      auth,
      pageId: propsValue.pageId,
      method: HttpMethod.GET,
      path: facebookPagesCommon.objectPath({ id: propsValue.postId }),
      queryParams: { fields: facebookPagesCommon.fieldsQuery({ fields: propsValue.fields, defaultFields: POST_FIELDS }) },
    });
  },
});
