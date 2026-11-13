import { createAction } from '@activepieces/pieces-framework';

import { microsoftSharePointAuth } from '../../../auth';
import { microsoftSharePointAiProps } from '../../../common/ai-props';
import { microsoftSharePointClient } from '../../../common/client';
import { microsoftSharePointPageCommon } from './page-common';
import { microsoftSharepointDeletePageOutputSchema } from '../../../output-schemas';

export const deletePageAction = createAction({
  auth: microsoftSharePointAuth,
  name: 'microsoft_sharepoint_delete_page',
  outputSchema: microsoftSharepointDeletePageOutputSchema,
  displayName: 'Delete Page',
  description: 'Deletes a page from a SharePoint site.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Deletes one page from the Site Pages library of a SharePoint site. List Pages returns the page IDs.',
    idempotent: false,
  },
  props: {
    siteId: microsoftSharePointAiProps.siteId({ required: true }),
    pageId: microsoftSharePointPageCommon.pageId(),
  },
  async run({ auth, propsValue }) {
    await microsoftSharePointClient
      .create({ auth })
      .api(`/sites/${encodeURIComponent(propsValue.siteId)}/pages/${encodeURIComponent(propsValue.pageId)}`)
      .delete();
    return { deleted: true, pageId: propsValue.pageId };
  },
});
