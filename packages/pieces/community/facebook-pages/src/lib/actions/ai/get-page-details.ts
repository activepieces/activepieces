import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { facebookPagesAuth } from '../../auth';
import { facebookPagesCommon, GraphRecord } from '../../common/common';
import { pageDetailsOutputSchema } from '../../output-schemas';

const PAGE_FIELDS =
  'id,name,username,category,about,description,link,website,phone,emails,single_line_address,followers_count,verification_status,is_published,picture{url},cover{source}';

export const getPageDetailsAction = createAction({
  auth: facebookPagesAuth,
  name: 'get_page_details',
  classification: 'READ',
  displayName: 'Get Page Details',
  description: 'Gets the profile details of a Facebook Page.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Get the public profile of one Facebook Page the connected account manages: name, username, category, about, description, website, phone, emails, address, follower count, verification status, profile picture and cover photo. Use Fields to request other Graph API Page fields. Read-only.',
    idempotent: true,
  },
  outputSchema: pageDetailsOutputSchema,
  props: {
    pageId: facebookPagesCommon.pageId,
    fields: facebookPagesCommon.fields({ defaultFields: PAGE_FIELDS }),
  },
  async run({ auth, propsValue }) {
    return facebookPagesCommon.pageRequest<GraphRecord>({
      auth,
      pageId: propsValue.pageId,
      method: HttpMethod.GET,
      path: facebookPagesCommon.objectPath({ id: propsValue.pageId }),
      queryParams: { fields: facebookPagesCommon.fieldsQuery({ fields: propsValue.fields, defaultFields: PAGE_FIELDS }) },
    });
  },
});
