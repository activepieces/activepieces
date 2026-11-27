import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';
import { boxUtils } from '../../../common/utils';

export const listFileAppItemAssociationsAction = createAction({
  auth: boxAuth,
  name: 'box_list_file_app_item_associations',
  displayName: 'List File App Item Associations',
  description: 'Lists the app items (such as Box Hubs) a Box file is associated with.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists one page of the app items a file is linked to, including through its parent folders, with the app item IDs and types. Beta Box feature, so it may be unavailable on some accounts. Get the file ID from List Folder Items or Search; page with Marker (next_marker).',
    idempotent: true,
  },
  props: {
    fileId: boxAiProps.fileId({ required: true }),
    applicationType: Property.ShortText({
      displayName: 'Application Type',
      description: 'Only return app items of this application type, e.g. "hubs".',
      required: false,
    }),
    limit: boxAiProps.limit({ required: false }),
    marker: boxAiProps.marker({ required: false }),
  },
  async run({ auth, propsValue }) {
    return await boxClient.request({
      auth,
      method: HttpMethod.GET,
      path: `/files/${encodeURIComponent(propsValue.fileId)}/app_item_associations`,
      query: {
        application_type: propsValue.applicationType,
        limit: boxUtils.limitParam({ limit: propsValue.limit, max: 1000, fallback: 100 }),
        marker: propsValue.marker,
      },
    });
  },
});
